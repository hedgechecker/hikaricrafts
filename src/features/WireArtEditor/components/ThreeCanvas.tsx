import { useEffect, useRef } from 'react';
import styles from './styles/ThreeCanvas.module.css';
import type { EditorEngine } from '../core/EditorEngine';

interface Props {
  engine: EditorEngine;
}

export default function ThreeCanvas({ engine }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize engine with container
    engine.initialize(mountRef.current);

    return () => {
      engine.dispose();
    };
  }, [engine]);

  return <div ref={mountRef} className={styles.container} />;
}
