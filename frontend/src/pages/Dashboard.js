import { useEffect, useState } from "react";

function Dashboard() {
  const [amount, setAmount] = useState("");
  const [orders, setOrders] = useState([]);

  const apiKey = localStorage.getItem("apiKey");
  const apiSecret = localStorage.getItem("apiSecret");

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:8000/api/v1/orders", {
      headers: {
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret
      }
    });

    const data = await res.json();
    if (res.status === 200) {
      setOrders(data.orders);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval=setInterval(fetchOrders,3000);
    return ()=> clearInterval(interval);
  }, []);

  const createOrder = async () => {
    const res = await fetch("http://localhost:8000/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret
      },
      body: JSON.stringify({
        amount: parseInt(amount) * 100
      })
    });

    const data = await res.json();

    if (res.status === 201) {
      fetchOrders();
    } else {
      alert(data.error.description);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Create Order</h2>
      <input
        placeholder="Amount in rupees"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={createOrder}>Create</button>

      <h2 style={{ marginTop: 40 }}>Orders</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Amount (₹)</th>
            <th>Status</th>
            <th>Checkout</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.amount / 100}</td>
              <td>{order.status}</td>
              <td>
                <a
                  href={`http://localhost:3001?order_id=${order.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pay
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;