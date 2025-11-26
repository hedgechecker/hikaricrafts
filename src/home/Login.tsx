import { useState } from "react";
import style from "./styles/Login.module.css";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_API_URL;


export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Logged in!");
      navigate("/");
    } else {
      alert(data.message || "Login failed");
    }
  };

  return (
    <div className={style.container}>
      
      <h2 className={style.title}>Anmelden</h2>

      <input
        className={style.input}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className={style.input}
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <p>Noch keinen Account? <a className={style.link} onClick={() => navigate("/register")}>Registrieren</a></p>

      <button className={style.button} onClick={login}>
        Anmelden
      </button>
      <button className={style.backButton} onClick={() => {
        navigate("/");
      }}>
        Abbrechen
      </button>
    </div>
  );
}

export default Login;