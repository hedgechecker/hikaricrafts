import styles from "./styles/BuyInformation.module.css";


interface BuyInformationProps {
    available: boolean
}

export function BuyInformation({available}: BuyInformationProps) {
  return (
    <div className={styles.layout}>
        <table className={styles.table}>
      <tbody>
        <tr className={styles.row}>
          <th className={styles.cell}>Versand:</th>
          <td className={styles.cell}><strong>kostenfrei</strong> mit DHL</td>
        </tr>
        {(available && 
        <tr className={styles.row}>
          <th className={styles.cell}>Lieferung:</th>
          <td className={styles.cell}>innerhalb von <strong>7-9</strong> Werktagen</td>
        </tr>
        )}
        <tr className={styles.row}>
          <th className={styles.cell}>Zahlungen:</th>
          <td className={styles.cell}>PayPal</td>
        </tr>
      </tbody>
    </table>
    <button className={styles.cart}>In den Warenkorb</button>
    </div>
  );
}