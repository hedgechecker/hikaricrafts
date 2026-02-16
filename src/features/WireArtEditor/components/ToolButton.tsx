import styles from "./styles/ToolButton.module.css";
interface Props {
  label: string;
  active?: boolean;
  image?: string;
  toolTip?: string;
  onClick?: () => void;
}

export default function ToolButton({ label, active, image, toolTip, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${toolTip && styles.tooltip} ${active && styles.selected}`}
      data-tooltip={toolTip}
    >
      {image && <img src={image} className={styles.image} />}
      {label}
    </button>
  );
}
