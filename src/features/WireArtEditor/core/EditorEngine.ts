import { ThreeEditor, type ToolType } from '../three/ThreeEditor.ts';
import { ProjectManager } from './ProjectManager.ts';

export class EditorEngine {
  private projectManager: ProjectManager;
  private threeEditor?: ThreeEditor;

  constructor() {
    this.projectManager = new ProjectManager();
  }

  initialize(container: HTMLDivElement) {
    if (this.threeEditor) return; // prevent double mount

    this.threeEditor = new ThreeEditor(container);
  }

  setActiveTool(type: ToolType) {
    this.threeEditor?.setActiveTool(type);
  }
  setBackgroundImage(url: string) {
    this.projectManager.setBackground(url);
    this.threeEditor?.setBackgroundImage(url);
  }

  dispose() {
    this.projectManager.dispose();
    this.threeEditor?.dispose();
    this.threeEditor = undefined;
  }
}
