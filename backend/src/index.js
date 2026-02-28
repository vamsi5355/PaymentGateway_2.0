const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const seedTestMerchant = require("./seed");

const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const authenticate = require("./middleware/auth");

const app = express();

/* ========================
   CORS CONFIGURATION
======================== */

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-Api-Key", "X-Api-Secret"],
    credentials: true
  })
);


// Handle preflight requests

/* ========================
   MIDDLEWARE
======================== */

app.use(express.json());

/* ========================
   HEALTH CHECK
======================== */

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(200).json({
      status: "healthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

/* ========================
   AUTH TEST ROUTE
======================== */

app.get("/secure-test", authenticate, (req, res) => {
  res.json({
    message: "Authenticated successfully",
    merchant: req.merchant.email,
  });
});

/* ========================
   TEST MERCHANT ROUTE
======================== */

app.get("/api/v1/test/merchant", async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, api_key FROM merchants WHERE email = 'test@example.com'"
  );

  return res.json(result.rows[0]);
});

/* ========================
   ROUTES
======================== */

app.use(orderRoutes);
app.use(paymentRoutes);


app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      description: "Something went wrong"
    }
  });
});
/* ========================
   START SERVER
======================== */

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedTestMerchant();
});