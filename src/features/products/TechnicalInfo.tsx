import styles from "./styles/TechnicalInfo.module.css";

interface TechnicalInfoProps {
  info: Record<string, unknown>;
}

export function TechnicalInfo({ info }: TechnicalInfoProps) {
  const entries = Object.entries(info ?? {});

  return (
    <>
      <table className={styles.table}>
        <caption>Technische Informationen</caption>
        <tbody>
          {entries
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <tr key={key} className={styles.row}>
                <th className={styles.cell}>{key}</th>
                <td className={styles.cell}>
                  {Array.isArray(value)
                    ? value.join(" x ")
                    : value === null || value === undefined
                      ? "-"
                      : String(value)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}
