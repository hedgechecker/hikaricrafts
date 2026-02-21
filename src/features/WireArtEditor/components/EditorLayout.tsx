import { useState } from "react";
import Toolbar from "./Toolbar";
import ThreeCanvas from "./ThreeCanvas";
import styles from "./styles/EditorLayout.module.css";
import SideBar from "./Sidebar";
import type { ThreeEditor } from "../three/ThreeEditor";


export default function EditorLayout() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [editor, setEditor] = useState<ThreeEditor | null>(null);

  return (
    <div className={styles.wrapper}>
      <Toolbar onImageSelected={setBackgroundImage} onSelectTool={(tool) => editor?.setActiveTool(tool)} />
      <div className={styles.center}>
        <SideBar></SideBar>
        <ThreeCanvas onEditorReady={setEditor} imageUrl={backgroundImage} />

      </div>
    </div>
  );
}
