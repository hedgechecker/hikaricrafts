import { type ReactNode } from "react";
import styles from "./styles/ProductDescription.module.css";


interface ProductDescriptionProps {
  title: string;
  price: number;
  available: number;
  description?: string;
  children?: ReactNode;
}

export function ProductDescription({ title, description, children }: ProductDescriptionProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.title}>{title}</div>
      {children}

      {/* <div>
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
      </div>*/}

      {description && <div className={styles.description}>{description}</div>}

      {/* <div className={styles.layout}>
        <table className={styles.table}>
          <tbody>
            <tr className={styles.row}>
              <th className={styles.cell}>Versand:</th>
              <td className={styles.cell}>
                <strong>kostenfrei</strong> mit DHL
              </td>
            </tr>
            {available && (
              <tr className={styles.row}>
                <th className={styles.cell}>Lieferung:</th>
                <td className={styles.cell}>
                  innerhalb von <strong>7-9</strong> Werktagen
                </td>
              </tr>
            )}
            <tr className={styles.row}>
              <th className={styles.cell}>Zahlungen:</th>
              <td className={styles.cell}>PayPal</td>
            </tr>
          </tbody>
        </table>
        <button className={styles.cart}>In den Warenkorb</button>
      </div> */}
    </div>
  );
}

