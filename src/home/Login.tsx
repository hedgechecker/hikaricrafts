import { useState } from "react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Logged in!");
    } else {
      alert(data.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "60px auto" }}>
      <h2>Login</h2>
      <input 
        placeholder="Email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <input 
        placeholder="Password" 
        type="password"
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <button onClick={login}>Login</button>
    </div>
  );
}
