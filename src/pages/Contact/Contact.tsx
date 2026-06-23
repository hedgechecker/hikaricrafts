import { useState } from 'react';
import styles from './Contact.module.css';
const BASE_URL = import.meta.env.VITE_API_URL;

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [success, setSuccess] = useState(false);

  async function sendEmail() {
    const response = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        subject: subject,
        message: text,
      }),
    });

    if (!response.ok) throw new Error('Failed to send Email');

    setText('');
    setName('');
    setEmail('');
    setSubject('');
    setSuccess(true);

    setTimeout(() => setSuccess(false), 3000); // hide after 3s
  }

  return (
    <div className={styles.page}>
      <main className={styles.container} role='main'>
        <div className={styles.labeling}>
          <h2 className={styles.title}>Kontakt</h2>
          <div className={styles.inputField}>
            <label className={styles.label}>Email</label>
            <label className={styles.label}>lukas_n3@gmx.de</label>
          </div>
          {/* <div className={styles.inputField}>
            <label className={styles.label}>Telefon</label>
            <label className={styles.label}>0 159 12341234</label>
          </div> */}
        </div>
        <p>
          {" "}
          Sie können mir hier gerne Ihre Projektideen, Fragen zu Produkten oder
          allgemeine Fragen direkt stellen.
        </p>

        {!success && (
          <>
            <h2>Eine Nachricht senden</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <div className={styles.inputField}>
                <div className={styles.labeling}>
                  <label className={styles.label}>Ihr Name </label>
                  <div className={styles.charCount}>{name.length}/30</div>
                </div>
                <input
                  className={styles.textarea}
                  placeholder="Max Mustermann"
                  value={name}
                  type="text"
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div className={styles.inputField}>
                <div className={styles.labeling}>
                  <label className={styles.label}>Email </label>
                  <div className={styles.charCount}>{email.length}/50</div>
                </div>
                <input
                  className={styles.textarea}
                  placeholder="mustermann@email.de"
                  value={email}
                  type="text"
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>
            <div className={styles.inputField}>
              <div className={styles.labeling}>
                <label className={styles.label}>Betreff </label>
                <div className={styles.charCount}>{subject.length}/100</div>
              </div>
              <input
                className={styles.textarea}
                placeholder="Wie kann ich behilflich sein?"
                value={subject}
                type="text"
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className={styles.inputField}>
              <div className={styles.labeling}>
                <label className={styles.label}>Nachricht </label>
                <div className={styles.charCount}>{text.length}/4000</div>
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Erzählen Sie von Ihrem Anliegen..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={4000}
                style={{ minHeight: "400px" }}
              />
            </div>
            <button
              className={styles.button}
              onClick={() => {
                sendEmail();
              }}
            >
              Absenden
            </button>{" "}
          </>
        )}

        {success && (
          <div className={styles.successAnimation}>
            <svg viewBox="0 0 52 52">
              <path
                d="M14 27 L22 35 L38 17"
                fill="none"
                stroke="#4BB543"
                strokeWidth="5"
              />
            </svg>
            <h2> Nachricht wurde abgeschickt</h2>
          </div>
        )}
      </main>
    </div>
  );
}
