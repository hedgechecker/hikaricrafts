import { useState, type ReactNode } from "react";
import styles from "./styles/Card.module.css";
import dropdownIcon from '/src/assets/dropdown.png';

interface CardProps {
  title?: string;
  children?: ReactNode;
  padding?: boolean;
  selected?: boolean;
  foldable?: boolean;
}

export default function Card({
  title,
  children,
  padding,
  selected,
  foldable,
}: CardProps) {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div
      className={`${styles.card} ${padding ? styles.cardp : ""} ${
        selected ? styles.selected : ""
      }`}
    >
      <div className={styles.top}>
        {title && <h2 className={styles.cardTitle}>{title}</h2>}
        {foldable && (
          <button className={styles.button} onClick={() => setOpen(!open)}>
            <img
              id="image"
              src={dropdownIcon}
              className={styles.image}
              style={{
                transform: open ? "rotate(0deg)" : "rotate(90deg)",
                transition: "transform 0.3s ease",
              }}
            ></img>
          </button>
        )}
      </div>
      <div id="content" className={`${styles.cardContent} ${(open&&foldable) ? styles.open : (foldable)? styles.closed : ""}`}>
        {children}
      </div>
    </div>
  );
}
