import { useState } from "react";
import style from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { logInfo } from "../../utils/error/errorHandler";
const BASE_URL = import.meta.env.VITE_API_URL;

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      logInfo("Erfolgreich eingeloggt", {
        function: "Login/login",
        token: data.token,
        email: email,
        UIvisible: true,
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } else {
      logInfo("Benutzername oder Passwort falsch", {
        function: "Login/login",
        token: data.token,
        message: data.message,
        email: email,
        UIvisible: true,
      });
    }
  };

  return (
    <main className={style.container} role="main">
      <meta
        name="description"
        content="A Login Form for the HikariCrafts Website"
      ></meta>
      <h2 className={style.title}>Anmelden</h2>

      <input
        className={style.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className={style.input}
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Enter") login();
        }}
      />

      <p>
        Noch keinen Account?{" "}
        <button
          className={style.link}
          title="Navigiere zur Registrierung"
          onClick={() => navigate("/register")}
        >
          Registrieren
        </button>
      </p>
      <button className={style.button} onClick={login}>
        Anmelden
      </button>
      <button
        className={style.backButton}
        onClick={() => {
          navigate("/");
        }}
      >
        Abbrechen
      </button>
    </main>
  );
}

export default Login;
