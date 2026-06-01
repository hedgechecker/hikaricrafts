import { useEffect, useRef } from "react";
import { logWarn } from "../../../utils/error/errorHandler";
import styles from "./styles/PatternCanvas.module.css";
import { PatternEditor } from "../core/PatternEditor";
import SVG from "./SVG";
import { PATTERNS } from "../models/Pattern";
import type { ThreeEditor } from "../core/ThreeEditor";

interface Props {
  engine1: ThreeEditor;
}

export default function PatternCanvas({ engine1 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

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

    mount.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    return () => {
      engine.dispose();
    };
  }, []);


  return (
    <>
      {" "}
      <div ref={mountRef} className={styles.container} id="canvas" />
      <div>
        <div className={styles.grid}>
          {PATTERNS.map((pattern) => (
            <div key={pattern} className={styles.gridItem} >
              <div title={pattern}
                tabIndex={0}
                role="button"
                className={styles.container}
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
