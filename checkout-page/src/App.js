import { useEffect, useState } from "react";

function App() {
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(null);
  const [vpa, setVpa] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  useEffect(() => {
    if (!orderId) return;

    fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`)
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(() => alert("Order not found"));
  }, [orderId]);

  const handlePayment = async () => {
    setLoading(true);

    let body;

    if (method === "upi") {
      body = {
        order_id: orderId,
        method: "upi",
        vpa: vpa
      };
    }

    if (method === "card") {
      body = {
        order_id: orderId,
        method: "card",
        card: {
          number: cardNumber,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cvv,
          holder_name: holderName
        }
      };
    }

    try {
      const res = await fetch(
        "http://localhost:8000/api/v1/payments/public",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      await res.json();

      if (res.status === 201) {
        setResult("success");
      } else {
        setResult("failed");
      }
    } catch (err) {
      setResult("failed");
    }

    setLoading(false);
  };

  if (!order) return <h2 style={{ padding: 40 }}>Loading...</h2>;

  if (result === "success")
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ color: "green" }}>Payment Successful ✅</h2>
        <button onClick={() => window.location.href = "http://localhost:3000/dashboard"}>
          Back to Dashboard
        </button>
      </div>
    );

  if (result === "failed")
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ color: "red" }}>Payment Failed ❌</h2>
        <button onClick={() => setResult(null)}>Retry</button>
      </div>
    );

  return (
    <div style={{ padding: 40 }}>
      <h2>Pay ₹{order.amount / 100}</h2>

      <br />

      <button onClick={() => setMethod("upi")}>
        Pay via UPI
      </button>

      <button
        style={{ marginLeft: 10 }}
        onClick={() => setMethod("card")}
      >
        Pay via Card
      </button>

      <br /><br />

      {method === "upi" && (
        <div>
          <input
            placeholder="Enter VPA (example: user@paytm)"
            value={vpa}
            onChange={e => setVpa(e.target.value)}
          />
          <br /><br />
          <button disabled={loading} onClick={handlePayment}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      )}

      {method === "card" && (
        <div>
          <input
            placeholder="Card Number"
            value={cardNumber}
            onChange={e => setCardNumber(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="Expiry Month (MM)"
            value={expiryMonth}
            onChange={e => setExpiryMonth(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="Expiry Year (YY or YYYY)"
            value={expiryYear}
            onChange={e => setExpiryYear(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="CVV"
            value={cvv}
            onChange={e => setCvv(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="Card Holder Name"
            value={holderName}
            onChange={e => setHolderName(e.target.value)}
          />
          <br /><br />
          <button disabled={loading} onClick={handlePayment}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;