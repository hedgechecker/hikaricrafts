import { useState } from "react";
import Toolbar from "./Toolbar";
import ThreeCanvas from "./ThreeCanvas";
import styles from "./styles/EditorLayout.module.css";


export default function EditorLayout() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <Toolbar onImageSelected={setBackgroundImage} />
      <ThreeCanvas imageUrl={backgroundImage} />
    </div>
  );
}
