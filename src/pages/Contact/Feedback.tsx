import { useState } from "react";
import styles from "./Feedback.module.css";
import { logError } from "../../utils/error/errorHandler";
const BASE_URL = import.meta.env.VITE_API_URL;

export default function Feedback() {
  const [text, setText] = useState("");
  const [rating, setRating] = useState("Kleiner Fehler");
  const [success, setSuccess] = useState(false);

  const submitFeedback = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          rating: rating,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      setText("");
      setRating("");
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000); // hide after 3s
    } catch (err) {
      logError("Ein Fehler ist aufgetreten.", {
        function: "Feedback/submitFeedback",
        err: err,
        UIvisible: true,
      });
    }
  };

  return (
    <div className={styles.page}>
      <meta
        name="description"
        content="A simple Feedback input, to help improve the usability of this Woodworking Website"
      ></meta>

      <main className={styles.container} role="main">
        {!success && (
          <>
            <h2 className={styles.title}>Feedback</h2>
            <p>
              {" "}
              Diese Seite ist noch in der Entstehungsphase und dient nur als
              Vorschau verschiedener Produkte. Wenn Sie Fehler/Bugs oder nervige
              Kleinigkeiten finden, würde es mir sehr helfen, wenn Sie diese
              hier anonym melden würden.
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Anonym Fehler oder Anmerkungen mitteilen"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <label htmlFor="select-feedback-type" className={styles.label}>
              Art des Feedbacks:
            </label>
            <select
              id="select-feedback-type"
              className={styles.select}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value={"Kleiner Fehler"}>Kleiner Fehler</option>
              <option value={"Mittelschwerer Fehler"}>
                Mittelschwerer Fehler
              </option>
              <option value={"Bahnbrechender Fehler"}>
                Bahnbrechender Fehler
              </option>
              <option value={"Anmerkung"}>Anmerkung</option>
              <option value={"Wunsch"}>Wunsch</option>
              <option value={"Weiß ich nicht"}>Weiß ich nicht</option>
            </select>
            <button className={styles.button} onClick={submitFeedback}>
              Absenden
            </button>{" "}
          </>
        )}

        {success && (
          <div className="success-animation">
            <svg viewBox="0 0 52 52">
              <path
                d="M14 27 L22 35 L38 17"
                fill="none"
                stroke="#4BB543"
                strokeWidth="5"
              />
            </svg>
            <p> Danke für ihr Feedback</p>
          </div>
        )}
      </main>
    </div>
  );
}
