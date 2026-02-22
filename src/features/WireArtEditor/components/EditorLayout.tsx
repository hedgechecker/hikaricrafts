import { useState } from 'react';
import Toolbar from './Toolbar';
import ThreeCanvas from './ThreeCanvas';
import styles from './styles/EditorLayout.module.css';
import SideBar from './Sidebar';
import { EditorEngine } from '../core/EditorEngine';

export default function EditorLayout() {
  const [engine] = useState(() => new EditorEngine());

  return (
    <div className={styles.wrapper}>
      <Toolbar
        onImageSelected={(img) => engine.setBackgroundImage(img)}
        onSelectTool={(tool) => engine.setActiveTool(tool)}
      />
      <div className={styles.center}>
        <SideBar></SideBar>
        <ThreeCanvas engine={engine} />
      </div>
    </div>
  );
}
