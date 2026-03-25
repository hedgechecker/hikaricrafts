import styles from './styles/ToolButton.module.css';
interface Props {
  label: string;
  id?: string;
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
export default function ToolButton({ id, label, active, image, toolTip, onClick }: Props) {
  let lastTouchTime = 0;

  const handleClick = () => {
    if (Date.now() - lastTouchTime < 50) return;
    lastTouchTime = Date.now();
    onClick?.();
  };

  return (
    <button
      id={id}
      onClick={handleClick}
      className={`${styles.button} ${toolTip && styles.tooltip} ${active && styles.selected}`}
      data-tooltip={toolTip}
    >
      {image && <img src={image} className={styles.image} />}
      {label}
    </button>
  );
}
