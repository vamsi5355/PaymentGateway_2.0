const express = require("express");
const pool = require("../config/db");
const authenticate = require("../middleware/auth");
const { generateOrderId } = require("../utils/idGenerator");

const router = express.Router();

/* =========================================
   CREATE ORDER (Authenticated)
========================================= */
router.post("/api/v1/orders", authenticate, async (req, res) => {
  const { amount, currency = "INR", receipt, notes } = req.body;

  // Validate amount
  if (!amount || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "amount must be at least 100"
      }
    });
  }

  try {
    const orderId = generateOrderId();

    await pool.query(
      `
      INSERT INTO orders
      (id, merchant_id, amount, currency, receipt, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'created')
      `,
      [
        orderId,
        req.merchant.id,
        amount,
        currency,
        receipt || null,
        notes || null
      ]
    );

    const result = await pool.query(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    );

    const order = result.rows[0];

    return res.status(201).json({
      id: order.id,
      merchant_id: order.merchant_id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
      status: order.status,
      created_at: order.created_at
    });

  } catch (err) {
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Order creation failed"
      }
    });
  }
});

/* =========================================
   GET ALL ORDERS (Authenticated)
========================================= */
router.get("/api/v1/orders", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, amount, currency, status, created_at
      FROM orders
      WHERE merchant_id = $1
      ORDER BY created_at DESC
      `,
      [req.merchant.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      orders: result.rows
    });

  } catch (err) {
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Failed to fetch orders"
      }
    });
  }
});

/* =========================================
   GET SINGLE ORDER (Authenticated)
========================================= */
router.get("/api/v1/orders/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT * FROM orders
      WHERE id = $1 AND merchant_id = $2
      `,
      [id, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found"
        }
      });
    }

    const order = result.rows[0];

    return res.status(200).json({
      id: order.id,
      merchant_id: order.merchant_id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at
    });

  } catch (err) {
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Failed to fetch order"
      }
    });
  }
});

/* =========================================
   PUBLIC ORDER (Checkout)
========================================= */
router.get("/api/v1/orders/:id/public", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, amount, currency, status
      FROM orders
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found"
        }
      });
    }

    const order = result.rows[0];

    return res.status(200).json({
      id: order.id,
      entity: "order",
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

  } catch (err) {
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Failed to fetch order"
      }
    });
  }
});

module.exports = router;