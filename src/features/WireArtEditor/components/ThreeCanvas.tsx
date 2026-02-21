import { useEffect, useRef } from "react";
import { ThreeEditor } from "../three/ThreeEditor"
import styles from "./styles/ThreeCanvas.module.css";


interface Props {
  imageUrl: string | null;
  onEditorReady?: (editor: ThreeEditor) => void;
}

export default function ThreeCanvas({ imageUrl, onEditorReady }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ThreeEditor | null>(null);

  useEffect(() => {
  if (!mountRef.current) return;

  // Prevent duplicate canvas
  mountRef.current.innerHTML = "";

  const editor = new ThreeEditor(mountRef.current);
  editorRef.current = editor;
  onEditorReady?.(editor);
  //For testing Purpose
  imageUrl = "./test-image.webp";
  return () => {
    editor.dispose();
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
