import { useState } from 'react';
import Toolbar from './Toolbar';
import ThreeCanvas from './ThreeCanvas';
import styles from './styles/EditorLayout.module.css';
import SideBar from './Sidebar';
import { ThreeEditor } from '../core/ThreeEditor';
import {  TutorialProvider } from './tutorial/tutorialProvider';
import { TutorialOverlay } from './tutorial/TutorialOverlay';

/**
 * Handles the High-Level Layout of the Editor
 */
export default function EditorLayout() {
  const [engine, setEngine] = useState<ThreeEditor | null>(null);
  

  return (
    <TutorialProvider>
      <div className={styles.wrapper}>
        {engine && <Toolbar engine={engine} />}
        {/* Update class to trigger resizing event*/}
        <div className={`${engine ? styles.center : ''}`}>
          {engine && <SideBar engine={engine} />}
          <ThreeCanvas setEngine={setEngine} />
        </div>
      </div>
      <TutorialOverlay />
    </TutorialProvider>
  );
}
