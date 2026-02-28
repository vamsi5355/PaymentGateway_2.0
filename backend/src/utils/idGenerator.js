function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 16; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `order_${random}`;
}

function generatePaymentId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 16; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${random}`;
}

module.exports = {
  generateOrderId,
  generatePaymentId
};