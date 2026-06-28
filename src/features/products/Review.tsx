import { useEffect, useState } from "react";
import type { ReviewWithUser } from "../../../server/types";
import { Stars } from "../global/Stars";
import styles from "./styles/Review.module.css";
import { useNavigate } from "react-router-dom";
import { showDialog } from "../global/useDialog";

const BASE_URL = import.meta.env.VITE_API_URL;

interface ReviewProps {
  productId: number;
}

export default function Reviews({ productId }: ReviewProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [UserReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  const navigate = useNavigate();

  const maxCount = 1;
  useEffect(() => {
    fetch(`${BASE_URL}/reviews?productId=${productId}`)
      .then((res) => res.json())
      .then(setReviews);

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data.id));
  }, []);

  useEffect(() => {
    for (var i = 0; i < reviews.length; i++) {
      if (reviews[i].userId === currentUserId) {
        setUserReview(reviews[i]);
      }
    }
  }, [reviews, currentUserId]);

  function createEmptyReview() {
    setEditing(-1);
    const rev: ReviewWithUser = {
      user: {
        name: "Ihr Kommentar",
        verified: false,
      },
      productId: productId,
      rating: 1,
      title: "",
      comment: "",
      id: -1,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: -1,
    };
    setUserReview(rev);
  }

  const createReview = async () => {
    if (!UserReview) return;

    const token = localStorage.getItem("token");

    const newReview = {
      title: UserReview.title,
      rating: UserReview.rating,
      comment: UserReview.comment,
      productId,
    };

    await fetch(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newReview),
    });

    fetch(`${BASE_URL}/reviews?productId=${productId}`)
      .then((res) => res.json())
      .then(setReviews);
    setEditing(null);
    await showDialog({
      type: "alert",
      message: "Bewertung erfolgreich gespeichert",
    });
  };

  const editReview = async () => {
    if (!UserReview) return;
    if (!editing) return;
    if (editing == -1) {
      createReview();
      return;
    }

    const token = localStorage.getItem("token");

    await fetch(`${BASE_URL}/reviews/${editing}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: UserReview.title,
        rating: UserReview.rating,
        comment: UserReview.comment,
      }),
    });

    fetch(`${BASE_URL}/reviews?productId=${productId}`)
      .then((res) => res.json())
      .then(setReviews);
    setEditing(null);
    await showDialog({
      type: "alert",
      message: "Bewertung erfolgreich gespeichert",
    });
  };

  const deleteReview = async () => {
    if (!editing) return;
    const result = await showDialog({
      type: "confirm",
      message: "Sind Sie sicher, dass Sie die Bewertung löschen möchten?",
    });
    if (!result) return;
    await fetch(`${BASE_URL}/reviews/${editing}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setUserReview(null);
    setReviews(reviews.filter((r) => r.id !== editing));
    setEditing(null);
  };

  return (
    <>
      <div className={styles.reviewsSummary}>
        <div className={styles.ratingCta}>
          <div className={styles.ratingScore}>
            <span className={styles.score}>
              {reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                  reviews.length
                : 0}
            </span>
            <span>von 5</span>
          </div>

          <Stars
            rating={
              reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                  reviews.length
                : 0
            }
          />

          <p className={styles.reviewCount}>
            ({reviews.length} Bewertung{reviews.length != 1 ? "en" : ""})
          </p>
        </div>

        <div className={styles.ratingBreakdown}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(
              (review) => review.rating === star,
            ).length;
            return (
              <div key={star} className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>
                  {star} Stern{star > 1 ? "e" : ""}
                </span>

                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                    }}
                  />
                </div>
                {count > 0 ? count : "/"}
                <span></span>
              </div>
            );
          })}
        </div>

        {!UserReview && !currentUserId && (
          <div className={styles.reviewCta}>
            <h3>Bewertung erstellen</h3>
            <p>
              Um ihre Erfahrung mit anderen zu teilen, melden Sie sich bitte an
            </p>

            <button
              className={styles.primaryButton}
              onClick={() => navigate("/login")}
            >
              Zur Anmeldung
            </button>
          </div>
        )}
        {!UserReview && currentUserId && (
          <div className={styles.reviewCta}>
            <h3>Bewertung erstellen</h3>
            <p>Teilen Sie ihre Erfahrung mit anderen</p>

            <button
              className={styles.primaryButton}
              onClick={() => createEmptyReview()}
            >
              Bewertung schreiben
            </button>
          </div>
        )}
        {UserReview && (
          <div className={styles.reviewCta}>
            <h3>Bewertung</h3>
            <p>Sie haben dieses Produkt bereits bewertet, Vielen Dank!</p>

            {!editing && (
              <button
                className={styles.primaryButton}
                onClick={() => setEditing(UserReview.id)}
              >
                Meine Bewertung bearbeiten
              </button>
            )}
          </div>
        )}
      </div>

      {currentUserId && editing && UserReview && (
        <div className={styles.reviewsList} style={{ padding: "120px 0px" }}>
          <div key={UserReview.id} className={styles.reviewCard}>
            <div className={styles.reviewAvatar}>
              {UserReview.user.name.slice(0, 1).toLocaleUpperCase()}{" "}
            </div>

            <div className={styles.reviewContent}>
              <div className={styles.reviewTop}>
                <div>
                  <h4>{UserReview.user.name}</h4>
                </div>

                <span className={styles.reviewDate}>
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              {/* Editable Title */}
              <h5
                contentEditable={true}
                suppressContentEditableWarning={true}
                data-placeholder="Gib deiner Bewertung einen kurzen Titel..."
                onBlur={(e) => {
                  const updatedTitle = e.currentTarget.textContent;
                  if(updatedTitle) setUserReview({ ...UserReview, title: updatedTitle });
                }}
                className={styles.editableField}
                style={{
                  outline: "1px dashed var(--color-text-secondary)",
                  padding: "2px",
                }}
              >
                {UserReview.title}
              </h5>

              {/* Editable Comment */}
              <p
                contentEditable={true}
                suppressContentEditableWarning={true}
                data-placeholder="Teile deine Erfahrungen mit diesem Produkt..."
                onBlur={(e) => {
                  const updatedComment = e.currentTarget.textContent;
                  if (updatedComment)
                    setUserReview({ ...UserReview, comment: updatedComment });
                }}
                className={styles.editableField}
                style={{
                  outline: "1px dashed var(--color-text-secondary)",
                  padding: "2px",
                }}
              >
                {UserReview.comment}
              </p>

              <Stars
                rating={UserReview.rating}
                editable
                onRatingChange={(r) =>
                  setUserReview({ ...UserReview, rating: r })
                }
              />
              <div>
                <button
                  className={styles.primaryButton}
                  onClick={() => deleteReview()}
                >
                  Bewertung löschen
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => editReview()}
                >
                  Bewertung speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!editing && (
        <div className={styles.reviewListHeader}>
          <div>
            <h3>Kundenbewertungen</h3>
            <p>
              {" "}
              1-{reviews.length} von {reviews.length} werden angezeigt
            </p>
          </div>

          <div className={styles.sortWrapper}>
            <label htmlFor="sort">Sortieren nach:</label>
            <select id="sort">
              <option>Neueste</option>
              <option>Älteste</option>
              <option>Höchste Bewertung</option>
              <option>Niedrigste Bewertung</option>
            </select>
          </div>
        </div>
      )}

      {!editing && (
        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewAvatar}>
                {review.user.name.slice(0, 1).toLocaleUpperCase()}{" "}
              </div>

              <div className={styles.reviewContent}>
                <div className={styles.reviewTop}>
                  <div>
                    <h4>{review.user.name}</h4>
                    {review.user.verified && (
                      <span className={styles.verified}>(Verifiziert)</span>
                    )}
                  </div>

                  <span className={styles.reviewDate}>
                    {new Date(review.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h5>{review.title}</h5>

                <p>{review.comment}</p>

                <Stars rating={review.rating} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
