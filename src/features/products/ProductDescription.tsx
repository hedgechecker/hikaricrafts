import { type ReactNode } from "react";
import styles from "./styles/ProductDescription.module.css";
import { BuyInformation } from "./BuyInformation";


interface ProductDescriptionProps {
  title: string;
  price: number;
  available: number;
  description?: string;
  children?: ReactNode;
}

export function ProductDescription({ title, price, available, description, children }: ProductDescriptionProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.title}>  
        {title}
      </div>
      {children}

      <div>
      <div className={styles.cost}>
        Vorläufiger Preis: €{price.toFixed(2)}/Stk.
      </div>

      {available > 0 && (
        <div className={styles.available}>
          ✓ Zur Zeit verfügbar<br></br>
          ✓ kostenloser Versand deutschlandweit
        </div>
      )}
      {available <= 0 && (
        <div className={styles.unavailable}>
          ⨯ Dieser Artikel ist zur Zeit leider nicht verfügbar, könnte aber womöglich auf Anfrage wieder erstellt werden
        </div>
      )}
      </div>

      {description && (
        <div className={styles.description}>
          {description}
        </div>
      )}


      <BuyInformation available={available > 0} />

    </div>
  );
}

