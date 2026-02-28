function validateVPA(vpa) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return regex.test(vpa);
}

function validateCardNumber(number) {
  const cleaned = number.replace(/[\s-]/g, "");

  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function validateExpiry(month, year) {
  const m = parseInt(month);
  let y = parseInt(year);

  if (m < 1 || m > 12) return false;

  if (year.length === 2) {
    y = 2000 + y;
  }

  const now = new Date();
  const expiry = new Date(y, m - 1);

  return expiry >= new Date(now.getFullYear(), now.getMonth());
}

function detectCardNetwork(number) {
  const cleaned = number.replace(/[\s-]/g, "");

  if (cleaned.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(cleaned)) return "mastercard";
  if (/^(34|37)/.test(cleaned)) return "amex";
  if (/^(60|65|8[1-9])/.test(cleaned)) return "rupay";

  return "unknown";
}

module.exports = {
  validateVPA,
  validateCardNumber,
  validateExpiry,
  detectCardNetwork
};