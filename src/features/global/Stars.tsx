import React, { useState } from "react";
import styles from "./styles/Stars.module.css";

interface StarsProps {
  rating: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const Stars: React.FC<StarsProps> = ({
  rating,
  editable = false,
  onRatingChange,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const displayRating =
    editable && hoveredRating !== null ? hoveredRating : rating;
  const fillPercentage = Math.max(0, Math.min(100, (displayRating / 5) * 100));

  const handleStarClick = (index: number) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div
      className={`${styles.starsContainer} ${editable ? styles.editable : styles.readonly}`}
      onMouseLeave={() => editable && setHoveredRating(null)}
    >
      {/* Background Stars (Empty) */}
      <div className={`${styles.starsContainer} ${styles.starsBackground}`}>
        {[...Array(5)].map((_, i) => (
          <span
            key={`bg-${i}`}
            className={styles.starIcon}
            onMouseEnter={() => editable && setHoveredRating(i + 1)}
            onClick={() => handleStarClick(i)}
          >
            ✭
          </span>
        ))}
      </div>

      {/* Foreground Stars (Filled) clipped by percentage */}
      <div
        className={`${styles.starsLayer} ${styles.starsForeground}`}
        style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
      >
        {[...Array(5)].map((_, i) => (
          <span
            key={`fg-${i}`}
            className={`${styles.starsIcon} ${styles.filled}`}
            onMouseEnter={() => editable && setHoveredRating(i + 1)}
            onClick={() => handleStarClick(i)}
            onKeyDown={(e) => {
              if (e.key == "Enter"){ handleStarClick(i)};
            }}
            tabIndex={editable ? 0 : -1}
          >
            ✭
          </span>
        ))}
      </div>
    </div>
  );
};
