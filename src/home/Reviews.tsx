import { useEffect, useState } from "react";
import styles from "./styles/Reviews.module.css"

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  productId: number;
  userId: number;
}

interface CustomerReviewProps {
  productId: number;
}

export function CustomerReviews({productId} : CustomerReviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);

  function startEditing(review: Review) {
    setEditing(review);
    setRating(review.rating);
    setComment(review.comment);
  }

  useEffect(() => {
  fetch(`http://localhost:4000/reviews?productId=${productId}`)
    .then(res => res.json())
    .then(setReviews);

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:4000/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCurrentUserId(data.id));
  }, []);

  const submitReview = async () => {
  if (!name.trim() || !comment.trim()) return;

  const newReview = {
    rating,
    comment,
    date: new Date().toLocaleDateString("de-DE"),
    productId,
    currentUserId,
  };
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:4000/reviews", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
     },
    body: JSON.stringify(newReview)
  });

  const savedReview = await response.json();
  setReviews([savedReview, ...reviews]);

  setName("");
  setComment("");
  setRating(3);
};

const submitEdit = async () => {
  if (!editing) return;

  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:4000/reviews/${editing.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      rating,
      comment
    })
  });

  const updated = await res.json();

  // Update UI list
  setReviews(reviews.map(r => (r.id === updated.id ? updated : r)));

  // Clear edit mode
  setEditing(null);
  setComment("");
  setRating(3);
};

  return (
    <div className={styles.layout}>
      <h2 className={styles.header}>Kundenbewertungen</h2>

      <div className={styles.reviewContainer}>
        {reviews.length === 0 && (
          <p>Noch keine Bewertungen vorhanden.</p>
        )}

        {reviews.map((r) => (
          <div key={r.id} className={styles.review}>
            <div className={styles.head}><div>{r.name}</div> <div style={{fontSize: 'var(--font-size-md)'}}>{r.date}</div></div>
            <div className={styles.stars}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p className={styles.comment}>{r.comment}</p>
            {r.userId === currentUserId && (
            <button 
              className={styles.editButton} 
              onClick={() => startEditing(r)}
            >
              Bearbeiten
            </button>
          )}
            
          </div>
        ))}
      </div>

    
      {/* Review Form */}
    <div className={styles.form}>
    {!editing && (
      <h3 className={styles.formHeader}>Neue Bewertung schreiben</h3>)}
    {!isLoggedIn && (
      <p style={{ color: "red", marginTop: "8px" }}>
        Loggen Sie sich ein, um eine Bewertung schreiben zu können.
      </p>
    )}
    {isLoggedIn && !editing && (
      <>
    <div className={styles.inputContainer}>
        <input
            className={styles.input}
            placeholder="Ihr Name"
            value={name}
            maxLength={30}  
            onChange={(e) => setName(e.target.value)}
        />
        <div className={styles.charCount}>{name.length}/30</div>
    </div>
        
        
    <div className={styles.starSelect}>
        {[1,2,3,4,5].map((star) => (
        <span
        key={star}
        className={star <= rating ? styles.starActive : styles.starInactive}
        onClick={() => setRating(star)}>
        ★
        </span>
        ))}
    </div>
        
    <div className={styles.inputContainer}>
        <textarea
        className={styles.textarea}
        placeholder="Ihre Bewertung"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={400}
        />
        <div className={styles.charCount}>{comment.length}/400</div>
    </div>

    <button className={styles.submit} onClick={submitReview}>
    Bewertung absenden
    </button>
    </>
    )}
    {editing && (
      <div className={styles.form}>
      <h3 className={styles.formHeader}>Bewertung bearbeiten</h3>

      <div className={styles.starSelect}>
        {[1,2,3,4,5].map(star => (
          <span
            key={star}
            className={star <= rating ? styles.starActive : styles.starInactive}
            onClick={() => setRating(star)}
          >★</span>
        ))}
      </div>

      <textarea
        className={styles.textarea}
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      <button onClick={submitEdit}>Änderungen speichern</button>
      <button onClick={() => setEditing(null)}>Abbrechen</button>
      </div>
    )}


    </div>
    </div>
  );
}
