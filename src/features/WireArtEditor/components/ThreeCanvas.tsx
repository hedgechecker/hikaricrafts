import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import styles from './styles/ThreeCanvas.module.css';
import { ThreeEditor } from '../core/ThreeEditor';

interface Props {
  setEngine: Dispatch<SetStateAction<ThreeEditor | null>>;
}

/**
 * Displays the UI for the WireArt Editor
 * @param engine The Orchestration for the Three Canvas
 */
export default function ThreeCanvas({ setEngine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const editor = new ThreeEditor(mount);
    setEngine(editor);

    const resizeObserver = new ResizeObserver(() => {
      editor.resize(mount);
    });

    resizeObserver.observe(mount);
    
    mount.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    return () => {
      editor.dispose();
    };
  }, []);

  return <div ref={mountRef} className={styles.container} />;
}
