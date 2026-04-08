import { createPortal } from "react-dom";
import { useState, useRef, type ReactNode } from "react";

type TooltipProps = {
  children: ReactNode;
  text?: string;
};

type Position = {
  x: number;
  y: number;
};

export default function Tooltip({ children, text }: TooltipProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement | null>(null);

  const showTooltip = () => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    setPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });

    setVisible(true);
  };

  const hideTooltip = () => setVisible(false);

  const portalRoot = document.getElementById("tooltip-root");

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: "inline-block" }}
      >
        {children}
      </div>

      {visible && text &&
        portalRoot &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.y - 8,
              left: pos.x,
              transform: "translate(-50%, 200%)",
              background: "black",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              zIndex: 9999,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>,
          portalRoot,
        )}
    </>
  );
}
