import styles from "./styles/ToolButton.module.css";
import Tooltip from "./ToolTip";
interface Props {
  label: string;
  id?: string;
  active?: boolean;
  inactive?: boolean;
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
export default function ToolButton({
  id,
  label,
  active,
  inactive,
  image,
  toolTip,
  onClick,
}: Props) {
  let lastTouchTime = 0;

  const handleClick = () => {
    if (Date.now() - lastTouchTime < 50) return;
    lastTouchTime = Date.now();
    onClick?.();
  };

  return (
    <Tooltip text={toolTip}>
      <button
        id={id}
        onClick={handleClick}
        className={`${styles.button}`}
        data-tooltip={toolTip}
        style={active ? { filter: "invert(1)" } : {}}
      >
        {image && (
          <img
            src={image}
            className={styles.image}
            style={inactive ? { filter: "invert(0.5)" } : {}}
          />
        )}
        {label}
      </button>
    </Tooltip>
  );
}
