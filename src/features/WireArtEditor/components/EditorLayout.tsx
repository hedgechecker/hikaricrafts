import { useState } from "react";
import Toolbar from "./Toolbar";
import ThreeCanvas from "./ThreeCanvas";
import styles from "./styles/EditorLayout.module.css";
import SideBar from "./Sidebar";


export default function EditorLayout() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <Toolbar onImageSelected={setBackgroundImage} />
      <div className={styles.center}>
        <SideBar></SideBar>
        <ThreeCanvas imageUrl={backgroundImage} />

      </div>
    </div>
  );
}
