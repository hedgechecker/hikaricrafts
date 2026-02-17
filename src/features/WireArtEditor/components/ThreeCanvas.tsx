import { useEffect, useRef } from "react";
import { ThreeEditor } from "../three/ThreeEditor"
import styles from "./styles/ThreeCanvas.module.css";


interface Props {
  imageUrl: string | null;
}

export default function ThreeCanvas({ imageUrl }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ThreeEditor | null>(null);

  useEffect(() => {
  if (!mountRef.current) return;

  // Prevent duplicate canvas
  mountRef.current.innerHTML = "";

  editorRef.current = new ThreeEditor(mountRef.current);

  return () => {
    editorRef.current?.dispose();
    editorRef.current = null;
  };
}, []);

  useEffect(() => {
    if (imageUrl) {
      editorRef.current?.setBackgroundImage(imageUrl);
    }
  }, [imageUrl]);

  return (
    <div
      ref={mountRef}
      className={styles.container}
    />
  );
}
