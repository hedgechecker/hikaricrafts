import { useEffect, useRef } from 'react';
import styles from './styles/ThreeCanvas.module.css';
import type { EditorEngine } from '../core/EditorEngine';

interface Props {
  engine: EditorEngine;
}

/**
 * Displays the UI for the WireArt Editor
 * @param engine The Orchestration for the Three Canvas
 */
export default function ThreeCanvas({ engine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    engine.initialize(mountRef.current);

    return () => {
      engine.dispose();
    };
  }, [engine]);

  return <div ref={mountRef} className={styles.container} />;
}
