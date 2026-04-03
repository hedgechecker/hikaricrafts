import { useContext, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import styles from "./styles/ThreeCanvas.module.css";
import { ThreeEditor } from "../core/ThreeEditor";
import { TutorialContext } from "./tutorial/TutorialProvider";

interface Props {
  setEngine: Dispatch<SetStateAction<ThreeEditor | null>>;
}

/**
 * Displays the UI for the WireArt Editor
 * @param setEngine The Orchestration for the Three Canvas
 */
export default function ThreeCanvas({ setEngine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tutorial = useContext(TutorialContext);
  let localengine: ThreeEditor;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const engine = new ThreeEditor(mount);
    setEngine(engine);

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
    localengine = engine;

    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!tutorial) return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("tutorial") && !tutorial.active) {
      localengine.loadGlobal(0);
      tutorial.start();
    }
  }, [tutorial]);

  return <div ref={mountRef} className={styles.container} id="canvas"/>;
}
