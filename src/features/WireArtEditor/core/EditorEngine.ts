import { ThreeEditor, type ToolType } from '../three/ThreeEditor.ts';

export class EditorEngine {
  private threeEditor?: ThreeEditor;

  constructor() {
  }

  initialize(container: HTMLDivElement) {
    if (this.threeEditor) return; // prevent double mount

    this.threeEditor = new ThreeEditor(container);
    this.threeEditor.start();
  }

  setActiveTool(type: ToolType) {
    this.threeEditor?.setActiveTool(type);
  }
  setBackgroundImage(url: string) {
    this.threeEditor?.setBackgroundImage(url);
  }

  dispose() {
    this.threeEditor?.dispose();
    this.threeEditor = undefined;
  }
}
