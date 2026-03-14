import styles from "./styles/ToolButton.module.css";
interface Props {
  label: string;
  active?: boolean;
  image?: string;
  toolTip?: string;
  onClick?: () => void;
}

/**
 * 
 * @param label the text on the Button
 * @param active set the button as selected
 * @param image a small image to describe the button action
 * @param toolTip text, that appears on hover
 * @returns 
 */
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
