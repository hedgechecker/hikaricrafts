import { useEffect, useState } from "react";
import styles from "./styles/Reviews.module.css"
const BASE_URL = import.meta.env.VITE_API_URL;

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  productId: number;
}

interface CustomerReviewProps {
  productId: number;
}

export function CustomerReviews({productId} : CustomerReviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [hasReview, setHasReview] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);

  function startEditing(review: Review) {
    setEditing(review);
    setRating(review.rating);
    setComment(review.comment);
  }

  useEffect(() => {
  fetch(`${BASE_URL}/reviews?productId=${productId}`)
    .then(res => res.json())
    .then(setReviews);

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCurrentUserId(data.id));
  }, []);

  useEffect(() => {
    for(var i = 0; i < reviews.length; i++){
      if(reviews[i].userId === currentUserId){
        setHasReview(true);
      }
    }
  }, [reviews, currentUserId])

  const submitReview = async () => {
  if (!comment.trim()) return;

  const token = localStorage.getItem("token");

  const newReview = {
    rating,
    comment,
    productId,
  };

  const response = await fetch(`${BASE_URL}/reviews`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
     },
    body: JSON.stringify(newReview)
  });

  const savedReview = await response.json();

  setReviews([savedReview, ...reviews]);
  setComment("");
  setRating(3);
};

const submitEdit = async () => {
  if (!editing) return;

  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/reviews/${editing.id}`, {
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

const deleteComment = async () => {
  if(!editing)return;
  await fetch(`${BASE_URL}/reviews/${editing.id}`, {
  method: "DELETE",
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
});
  setHasReview(false);
  setReviews(reviews.filter(r => r.id !== editing.id));
  setEditing(null);
  setComment("");
  setRating(3);
}

  return (
    <div className={styles.layout}>
      <h2 className={styles.header}>Kundenbewertungen</h2>

      <div className={styles.reviewContainer}>
        {reviews.length === 0 && (
          <p>Noch keine Bewertungen vorhanden.</p>
        )}

        {!editing && reviews.map((r) => (
          <div key={r.id} className={styles.review}>
            <div className={styles.head}>
              <div style={{fontSize: 'var(--font-size-md)'}}>
                {new Date(r.createdAt).toLocaleDateString("de-DE")}
              </div>
            </div>

            <div className={styles.stars}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </div>

            <p className={styles.comment}>{r.comment}</p>

            {r.userId === currentUserId && (
              <button 
                className={styles.button} 
                onClick={() => startEditing(r)}
              >
                Bearbeiten
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Write Review */}
      <div className={styles.form}>

        {!isLoggedIn && (
          <p style={{ color: "red", marginTop: "8px" }}>
            Loggen Sie sich ein, um eine Bewertung schreiben zu können.
          </p>
        )}

        {isLoggedIn && !editing && !hasReview && (
          <>
            <h3 className={styles.formHeader}>Neue Bewertung schreiben</h3>

            <div className={styles.starSelect}>
              {[1,2,3,4,5].map(star => (
                <span
                  key={star}
                  className={star <= rating ? styles.starActive : styles.starInactive}
                  onClick={() => setRating(star)}
                >★</span>
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

            <button className={styles.button} onClick={submitReview}>
              Bewertung absenden
            </button>
          </>
        )}

        {/* Edit Review */}
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
              maxLength={400}
            />
            <div className={styles.charCount}>{comment.length}/400</div>

            <button className={styles.button} onClick={submitEdit}>Änderungen speichern</button>
            <button className={styles.button}  onClick={() => setEditing(null)}>Abbrechen</button>
            <button className={styles.deleteButton} onClick={deleteComment}>Kommentar löschen</button>
          </div>
        )}
      </div>
    </div>
  );
}


