import {
  useContext,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import styles from "./styles/ThreeCanvas.module.css";
import { ThreeEditor } from "../core/ThreeEditor";
import { TutorialContext } from "./tutorial/TutorialProvider";
import { logInfo, logWarn } from "../../../utils/error/errorHandler";

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
    if (!mount) {
      logWarn("The Ref for the canvas isnt mounted", {
        function: "Canvas/useEffect([])",
        mount: mountRef.current,
      });
      return;
    }

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
      logInfo("The tutorial has been started");
      
      localengine.loadGlobal(0);
      tutorial.start();
    }
  }, [tutorial]);

  return <div ref={mountRef} className={styles.container} id="canvas" />;
}
