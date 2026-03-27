import { useContext, useState, useEffect } from 'react';
import { tutorialSteps } from './tutorialStep';
import { TutorialContext } from './TutorialProvider';
import styles from './tutorialOverlay.module.css';

export function TutorialOverlay() {
  // Always call hooks first
  const context = useContext(TutorialContext);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = context && tutorialSteps[context.stepIndex];

  // Function to update the element's bounding rect
  const updateRect = () => {
    if (!step) {
      setRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      setRect(null);
      return;
    }

    const computed = window.getComputedStyle(element);
    const borderTop = parseFloat(computed.borderTopWidth || '0');
    const borderBottom = parseFloat(computed.borderBottomWidth || '0');
    const borderLeft = parseFloat(computed.borderLeftWidth || '0');
    const borderRight = parseFloat(computed.borderRightWidth || '0');

    const bounding = element.getBoundingClientRect();

    setRect({
      top: bounding.top ,
      left: bounding.left ,
      width: bounding.width - borderLeft - borderRight,
      height: bounding.height - borderTop - borderBottom,
    });
  };

  // Always register effect hooks
  useEffect(() => {
    if (!step) return; // effect logic is safe
    updateRect(); // initial
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [step?.target]);

  // Early return for UI only
  if (!context || !context.active || !step || !rect) return null;

  const { next } = context;

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
        className={styles.tooltip}
        style={{
          top: rect.top + rect.height + window.scrollY + 10,
          left: rect.left + window.scrollX,
        }}
      >
        <p>{step.content}</p>
        <button onClick={next}>Next</button>
      </div>
    </>
  );
}
