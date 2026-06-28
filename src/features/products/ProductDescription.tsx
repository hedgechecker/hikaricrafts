import { useRef, useState } from "react";
import styles from "./styles/ProductDescription.module.css";
import type { FullOrderItem, FullProduct } from "../../../server/types";
import { Stars } from "../global/Stars";

interface ProductDescriptionProps {
  product: FullProduct;
  setSelectedVariation: (id: number) => void;
}

export function ProductDescription({
  product,
  setSelectedVariation,
}: ProductDescriptionProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVar, setSelectedVar] = useState(0);
  const [buttonLabel, setButtonLabel] = useState("In den Einkaufswagen");
  const resetLabelTimeoutRef = useRef<number | undefined>(undefined);

  function addtoBasket() {
    const item: FullOrderItem = {
      image: product.variations[selectedVar].images[0],
      variation: product.variations[selectedVar],
      id: 0,
      quantity: quantity,
      variationId: product.variations[selectedVar].id,
    };

    const data = localStorage.getItem("Basket");
    const items: FullOrderItem[] = (() => {
      if (!data) return [];
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    setButtonLabel("✓");
    if (resetLabelTimeoutRef.current) {
      window.clearTimeout(resetLabelTimeoutRef.current);
    }
    resetLabelTimeoutRef.current = window.setTimeout(() => {
      setButtonLabel("In den Einkaufswagen");
      resetLabelTimeoutRef.current = undefined;
    }, 1000);

    localStorage.setItem("Basket", JSON.stringify([...items, item]));
  }
  return (
    <div className={styles.productCard}>
      <h1 className={styles.title}>{product.name}</h1>

      <div className={styles.ratingRow}>
        <Stars
          rating={
            product.reviews.length > 0
              ? product.reviews.reduce(
                  (sum, review) => sum + review.rating,
                  0,
                ) / product.reviews.length
              : 0
          }
        />
        <span className={styles.ratingText}>
          {product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0}{" "}
          ({product.reviews.length} Bewertung
          {product.reviews.length != 1 ? "en" : ""})
        </span>
      </div>

      <span className={styles.currentPrice}>
        €{(product.variations[0].priceCents / 100).toFixed(2)}
      </span>

      <p className={styles.description}>{product.description}</p>

      {true && (
        <div className={styles.colorSection}>
          <span className={styles.label}>Variationen:</span>
          <span className={styles.colorName}>
            {product.variations[selectedVar].sku}
          </span>

          <div className={styles.colorOptions}>
            {product.variations.map((_var, id) => (
              <button
                key={id}
                className={`${styles.colorSwatch} ${
                  selectedVar === id ? styles.activeSwatch : ""
                }`}
                style={{
                  backgroundColor:
                    "#" + (((1 << 24) * (id / 10)) | 0).toString(16),
                }}
                onClick={() => {
                  setSelectedVar(id);
                  setSelectedVariation(id);
                }}
                aria-label={id.toString()}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionsRow}>
        <div className={styles.quantitySelector}>
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          >
            -
          </button>

          <span>{quantity}</span>

          <button type="button" onClick={() => setQuantity((prev) => prev + 1)}>
            +
          </button>
        </div>

        <button className={styles.addToCartBtn} onClick={() => addtoBasket()}>
          {buttonLabel}
        </button>
      </div>

      <div className={styles.features}>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🚚</span>
          <div>
            <strong>Kostenloser Versand</strong>
            <p>für alle Bestellungen innerhalb Deutschlands</p>
          </div>
        </div>

        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>↺</span>
          <div>
            <strong>30-Tage Rückgabe</strong>
            <p>Stressfreie Retouren</p>
          </div>
        </div>

        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🛡</span>
          <div>
            <strong>5 Jahre Garantie</strong>
            <p>Qualität garanitiert</p>
          </div>
        </div>
      </div>
    </div>
  );
}
