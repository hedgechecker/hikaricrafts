import { useEffect, useRef, useState } from "react";
import { logWarn } from "../../../utils/error/errorHandler";
import styles from "./styles/PatternCanvas.module.css";
import { PatternEditor } from "../core/PatternEditor";
import SVG from "./SVG";
import { PATTERNS, WOODTYPE } from "../models/Pattern";
import type { ThreeEditor } from "../core/ThreeEditor";
import { getWoodColor } from "../utils/materials";

interface Props {
  engine1: ThreeEditor;
}

export default function PatternCanvas({ engine1 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [currentPattern, setCurrentPattern] = useState(
    engine1.getStore().getState().selectedPattern,
  );
  const [currentWood, setCurrentWood] = useState(
    engine1.getStore().getState().selectedWood,
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      logWarn("The Ref for the canvas isnt mounted", {
        function: "Canvas/useEffect([])",
        mount: mountRef.current,
      });
      return;
    }

    const engine = new PatternEditor(mount, engine1.getStore());

    const resizeObserver = new ResizeObserver(() => {
      engine.resize(mount);
    });

    resizeObserver.observe(mount);

    const unsubscribe = engine1.getStore().subscribe(() => {
      setCurrentPattern(engine1.getStore().getState().selectedPattern);
      setCurrentWood(engine1.getStore().getState().selectedWood);
    });

    mount.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    return () => {
      engine.dispose();
      unsubscribe();
    };
  }, []);

  return (
    <>
      {" "}
      <div ref={mountRef} className={styles.container} id="canvas" />
      <div>
        <div className={styles.grid}>
          {WOODTYPE.map((wood) => (
            <div key={wood} className={styles.gridItem}>
              <div
                title={wood}
                tabIndex={0}
                role="button"
                style={{ backgroundColor: `#${getWoodColor(wood).getHexString()}` }}
                className={`${styles.wood} ${wood == currentWood ? styles.selected : ""}`}
                onClick={() => {
                  engine1.getStore().setSelectedWood(wood);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    engine1.getStore().setSelectedWood(wood);
                  }
                }}
              >
                {/* <div className={styles.label}>{pattern}</div> */}
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: "100%", height: "var(--space-md)" }}></div>

        <div className={styles.grid}>
          {PATTERNS.filter(
            (pattern) => pattern != "Outline" && pattern != "Mystery",
          ).map((pattern) => (
            <div key={pattern} className={styles.gridItem}>
              <div
                title={pattern}
                tabIndex={0}
                role="button"
                className={`${styles.pattern} ${pattern == currentPattern ? styles.patternSelected : ""}`}
                onClick={() => {
                  engine1.getStore().setSelectedPattern(pattern);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    engine1.getStore().setSelectedPattern(pattern);
                  }
                }}
              >
                <SVG type={pattern}></SVG>
                {/* <div className={styles.label}>{pattern}</div> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
