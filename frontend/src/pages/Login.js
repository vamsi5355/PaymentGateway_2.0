import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("apiSecret", apiSecret);
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Merchant Login</h2>
      <input
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <br /><br />
      <input
        placeholder="API Secret"
        value={apiSecret}
        onChange={(e) => setApiSecret(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;