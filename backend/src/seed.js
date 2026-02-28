const pool = require("./config/db");
const { sha256 } = require("./utils/hash");

async function seedTestMerchant() {
  try {
    const existing = await pool.query(
      "SELECT * FROM merchants WHERE email = $1",
      ["test@example.com"]
    );

    if (existing.rows.length > 0) {
      console.log("Test merchant already exists.");
      return;
    }

    const hashedSecret = sha256("test_secret");

    await pool.query(
      `
      INSERT INTO merchants
      (id, name, email, api_key, api_secret)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "550e8400-e29b-41d4-a716-446655440000",
        "Test Merchant",
        "test@example.com",
        "user-vvr",
        hashedSecret,
      ]
    );

    console.log("Test merchant seeded successfully.");
  } catch (err) {
    console.error("Seeding error:", err.message);
  }
}

module.exports = seedTestMerchant;