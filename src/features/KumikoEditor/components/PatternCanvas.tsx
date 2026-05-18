import { useEffect, useRef } from "react";
import { logWarn } from "../../../utils/error/errorHandler";
import styles from "./styles/PatternCanvas.module.css";
import { PatternEditor } from "../core/PatternEditor";


export default function PatternCanvas() {
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

    const engine = new PatternEditor(mount);

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

  return <div ref={mountRef} className={styles.container} id="canvas" />;
}
