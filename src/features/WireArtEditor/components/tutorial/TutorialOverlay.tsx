import { useContext, useState, useEffect, useRef } from "react";
import { tutorialSteps } from "./tutorialStep";
import { TutorialContext } from "./TutorialProvider";
import styles from "./tutorialOverlay.module.css";
import { logError } from "../../../../utils/error/errorHandler";

export function TutorialOverlay() {
  const context = useContext(TutorialContext);

  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const step = context && tutorialSteps[context.stepIndex];

  const updateRect = () => {
    if (!step) {
      setRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      logError(
        "The Element " +
          step.target +
          " specified by the TutorialStep " +
          step.id +
          " couldnt be found",
      );
      setRect(null);
      return;
    }

    const computed = window.getComputedStyle(element);
    const borderTop = parseFloat(computed.borderTopWidth || "0");
    const borderBottom = parseFloat(computed.borderBottomWidth || "0");
    const borderLeft = parseFloat(computed.borderLeftWidth || "0");
    const borderRight = parseFloat(computed.borderRightWidth || "0");

    const bounding = element.getBoundingClientRect();

    setRect({
      top: bounding.top,
      left: bounding.left,
      width: bounding.width - borderLeft - borderRight,
      height: bounding.height - borderTop - borderBottom,
    });
  };

  useEffect(() => {
    if (!step) return;
    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step?.target]);

  useEffect(() => {
    if (!rect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    const spacing = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.top + rect.height + spacing; // default: below
    let left = rect.left;

    if (top + tooltipRect.height > viewportHeight) {
      top = rect.top - tooltipRect.height - spacing;
    }

    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    if (top < 10) {
      top = 10;
    }

    setTooltipPos({
      top: top + window.scrollY,
      left: left + window.scrollX,
    });
  }, [rect]);

  if (!context || !context.active || !step || !rect) return null;

  const { next, prev } = context;

  return (
    <>
      <div className={styles.overlay} />

      <div
        className={styles.highlight}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />

      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        <p className={styles.text}>{step.content}</p>
        {step.id != "start" && (
          <button onClick={prev} className={styles.button}>
            Zurück
          </button>
        )}
        <button onClick={next} className={styles.button}>
          Weiter
        </button>
      </div>
    </>
  );
}
