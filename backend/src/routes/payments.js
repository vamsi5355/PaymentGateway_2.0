const express = require("express");
const pool = require("../config/db");
const authenticate = require("../middleware/auth");
const { generatePaymentId } = require("../utils/idGenerator");
const {
  validateVPA,
  validateCardNumber,
  validateExpiry,
  detectCardNetwork
} = require("../services/ValidationService");

const router = express.Router();

/* =========================================
   CREATE PAYMENT (Authenticated)
========================================= */
router.post("/api/v1/payments", authenticate, async (req, res) => {
  return createPayment(req, res, req.merchant.id);
});

/* =========================================
   CREATE PAYMENT (Public Checkout)
========================================= */
router.post("/api/v1/payments/public", async (req, res) => {
  const { order_id } = req.body;

  const orderResult = await pool.query(
    "SELECT * FROM orders WHERE id = $1",
    [order_id]
  );

  if (orderResult.rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found"
      }
    });
  }

  const order = orderResult.rows[0];

  return createPayment(req, res, order.merchant_id);
});

/* =========================================
   CORE PAYMENT LOGIC
========================================= */
async function createPayment(req, res, merchantId) {
  const { order_id, method, vpa, card } = req.body;

  if (!order_id || !method) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Missing required fields"
      }
    });
  }

  const orderResult = await pool.query(
    "SELECT * FROM orders WHERE id = $1",
    [order_id]
  );

  if (orderResult.rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found"
      }
    });
  }

  const order = orderResult.rows[0];

  // 🚫 Block if already paid or processing
  if (order.status !== "created") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Order already processed"
      }
    });
  }

  // 🚫 Prevent duplicate payments
  const existing = await pool.query(
    "SELECT * FROM payments WHERE order_id = $1 AND status IN ('processing','success')",
    [order.id]
  );

  if (existing.rows.length > 0) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Order already being processed or paid"
      }
    });
  }

  /* ========= VALIDATION ========= */

  if (method === "upi") {
    if (!vpa || !validateVPA(vpa)) {
      return res.status(400).json({
        error: {
          code: "INVALID_VPA",
          description: "VPA format invalid"
        }
      });
    }
  }

  if (method === "card") {
    if (!card) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Card details required"
        }
      });
    }

    const { number, expiry_month, expiry_year } = card;

    if (!validateCardNumber(number)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CARD",
          description: "Card validation failed"
        }
      });
    }

    if (!validateExpiry(expiry_month, expiry_year)) {
      return res.status(400).json({
        error: {
          code: "EXPIRED_CARD",
          description: "Card expiry date invalid"
        }
      });
    }
  }

  /* ========= LOCK ORDER IMMEDIATELY ========= */

  await pool.query(
    "UPDATE orders SET status='processing', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
    [order.id]
  );

  const paymentId = generatePaymentId();

  const cardNetwork =
    method === "card" ? detectCardNetwork(card.number) : null;

  const last4 =
    method === "card" ? card.number.replace(/\D/g, "").slice(-4) : null;

  await pool.query(
    `
    INSERT INTO payments
    (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4)
    VALUES ($1,$2,$3,$4,$5,$6,'processing',$7,$8,$9)
    `,
    [
      paymentId,
      order.id,
      merchantId,
      order.amount,
      order.currency,
      method,
      method === "upi" ? vpa : null,
      cardNetwork,
      last4
    ]
  );

  /* ========= PROCESSING ========= */

  let delay;
  let success;

  if (process.env.TEST_MODE === "true") {
    delay = parseInt(process.env.TEST_PROCESSING_DELAY || "1000");
    success = process.env.TEST_PAYMENT_SUCCESS !== "false";
  } else {
    delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    success =
      method === "upi"
        ? Math.random() < 0.9
        : Math.random() < 0.95;
  }

  await new Promise(resolve => setTimeout(resolve, delay));

  const finalStatus = success ? "success" : "failed";

  await pool.query(
    `
    UPDATE payments
    SET status=$1,
        error_code=$2,
        error_description=$3,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=$4
    `,
    [
      finalStatus,
      success ? null : "PAYMENT_FAILED",
      success ? null : "Payment processing failed",
      paymentId
    ]
  );

  if (success) {
    await pool.query(
      "UPDATE orders SET status='paid', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [order.id]
    );
  } else {
    // revert order back to created if failed
    await pool.query(
      "UPDATE orders SET status='created', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [order.id]
    );
  }

  return res.status(201).json({
    id: paymentId,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "processing"
  });
}

module.exports = router;