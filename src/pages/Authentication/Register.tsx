import { useState } from "react";
import style from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { logError, logInfo } from "../../utils/error/errorHandler";
import { showDialog } from "../../features/global/useDialog";
const BASE_URL = import.meta.env.VITE_API_URL;

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const hasOffensiveWords = (text: string) => {
    const banned = [
      "fuck",
      "shit",
      "bitch",
      "asshole",
      "nigger",
      "faggot",
      "cunt",
      "kys",
      "whore",
      "slut",
    ];
    const lower = text.toLowerCase();
    return banned.some((word) => lower.includes(word));
  };

  const checkEmailExists = async (email: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      return data.exists;
    } catch (err) {
      logError("Server returned error", {
        function: "Register/checkEmailExists",
        err: err,
        email: email,
      });
      return false;
    }
  };
  const login = async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      logInfo("Sie wurden erfolgreich registriert", {
        function: "Register/login",
        token: data.token,
        email: email,
        UIvisible: true,
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } else {
      logError("Login fehlgeschlagen", {
        function: "Register/login",
        res: res,
        email: email,
        UIvisible: true,
      });
    }
  };

  const register = async () => {
    if (!name || !email || !password) {
      await showDialog({
        type: "alert",
        message: "Bitte füllen Sie alle Felder aus",
      });
      return;
    }

    if (!isValidEmail(email)) {
      await showDialog({
        type: "alert",
        message: "Bitte geben Sie eine gültige Email an",
      });
      return;
    }

    if (hasOffensiveWords(name) || hasOffensiveWords(email)) {
      await showDialog({
        type: "alert",
        message: "Der Nutzername oder die Email enthält anstößige Wörter",
      });
      return;
    }

    const exists = await checkEmailExists(email);
    if (exists) {
      const result = await showDialog({
        type: "confirm",
        message: "Diese Email ist bereits registriert",
        cancelText: "Zurück",
        confirmText: "Zur Anmeldung",
      });
      if (result) {
        navigate("/login");
      }
      return;
    }

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    logInfo(data.message);
    if (data.message === "User created") {
      await login(); // automatic login
    }
  };

  return (
    <main className={style.container} role="main">
      <meta
        name="description"
        content="A Login Form for the HikariCrafts Website"
      ></meta>
      <h2 className={style.title}>Registrieren</h2>

      <input
        className={style.input}
        placeholder="Anzeigename"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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
      />

      <p>
        Bereits einen Account?{" "}
        <button
          className={style.link}
          title="Navigiere zum Login"
          onClick={() => navigate("/login")}
        >
          Anmelden
        </button>
      </p>

      <button className={style.button} onClick={register}>
        Account erstellen
      </button>

      <button className={style.backButton} onClick={() => navigate("/")}>
        Abbrechen
      </button>
    </main>
  );
}

export default Register;
