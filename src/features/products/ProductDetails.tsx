import styles from "./styles/ProductDetails.module.css";

interface ProductDetailsProps {
  dimensions?: number[];
  weightGrams?: number;
  material?: string;
  surfaceFinish?: string;
  warranty?: string;
  series?: string;
}

export function ProductDetails({
  dimensions,
  weightGrams,
  material,
  surfaceFinish,
  warranty,
  series,
}: ProductDetailsProps) {
  return (
    <table className={styles.table}>
      <tbody>
        {dimensions && (
          <tr className={styles.row}>
            <th className={styles.cell}>Abmessungen</th>
            <td className={styles.cell}>{dimensions.join(" x ")} mm</td>
          </tr>
        )}
        {weightGrams !== undefined && (
          <tr className={styles.row}>
            <th className={styles.cell}>Gewicht</th>
            <td className={styles.cell}>{weightGrams}g</td>
          </tr>
        )}
        {material && (
          <tr className={styles.row}>
            <th className={styles.cell}>Material</th>
            <td className={styles.cell}>{material}</td>
          </tr>
        )}
        {surfaceFinish && (
          <tr className={styles.row}>
            <th className={styles.cell}>Oberflächenbehandlung</th>
            <td className={styles.cell}>{surfaceFinish}</td>
          </tr>
        )}
        {warranty && (
          <tr className={styles.row}>
            <th className={styles.cell}>Garantie</th>
            <td className={styles.cell}>{warranty}</td>
          </tr>
        )}
        {series && (
          <tr className={styles.row}>
            <th className={styles.cell}>Serie</th>
            <td className={styles.cell}>{series}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
