import { useState } from "react";
import style from "./styles/Login.module.css";
import { useNavigate } from "react-router-dom";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email:string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const hasOffensiveWords = (text:string) => {
    const banned = [
      "fuck", "shit", "bitch", "asshole",
      "nigger", "faggot", "cunt", "kys",
      "whore", "slut"
    ];
    const lower = text.toLowerCase();
    return banned.some(word => lower.includes(word));
  };

  const checkEmailExists = async (email: string) => {
  try {
    const res = await fetch("http://localhost:4000/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    return data.exists; // true or false
  } catch (err) {
    console.error("Email check failed:", err);
    return false; // fail safe
  }
};
  const login = async () => {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate("/");
    } else {
      alert(data.message || "Login failed");
    }
  };

  const register = async () => {
    if (!name || !email || !password) {
      alert("Bitte fülle alle Felder aus.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Bitte gib eine gültige Email ein.");
      return;
    }

    if (hasOffensiveWords(name) || hasOffensiveWords(email)) {
      alert("Der Nutzername oder die Email enthält unzulässige Wörter.");
      return;
    }

    const exists = await checkEmailExists(email);
    if (exists) {
      alert("Diese Email ist bereits vergeben.");
     return;
    }

    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });

    const data = await res.json();
    alert(data.message);
    if (data.message === "User created") {
      await login(); // automatic login
    }
    navigate("/");
  };

  return (
    <div className={style.container}>
      <h2 className={style.title}>Registrieren</h2>

      <input
        className={style.input}
        placeholder="Nutzername"
        value={name}
        onChange={e => setName(e.target.value)}
      />

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

      <p>
        Bereits einen Account?{" "}
        <a className={style.link} onClick={() => navigate("/login")}>
          Anmelden
        </a>
      </p>

      <button className={style.button} onClick={register}>
        Account erstellen
      </button>

      <button className={style.backButton} onClick={() => navigate("/")}>
        Abbrechen
      </button>
    </div>
  );
}

export default Register;
