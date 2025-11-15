import { useState } from "react";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const register = async () => {
    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <div style={{ maxWidth: 300, margin: "60px auto" }}>
      <h2>Register</h2>

      <input 
        placeholder="Name" 
        value={name}
        onChange={e => setName(e.target.value)} 
      />

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

      <button onClick={register}>Create Account</button>
    </div>
  );
}
