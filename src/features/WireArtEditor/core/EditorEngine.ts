import type { Settings } from '../models/Settings.ts';
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

  getProject(){
    return this.threeEditor?.getProject();
  }

  loadGlobal(id: number){
    this.threeEditor?.loadGlobal(id);
  }

  save(){
    this.threeEditor?.save();
  }

  exportSVG(){
    return this.threeEditor?.exportSVG();
  }

  openNewProject(){
    this.threeEditor?.load(null);
  }

  hasChanges(){
    return this.threeEditor?.hasChanges;
  }

  updateSettings(settings: Settings){
    this.threeEditor?.setSettings(settings);
  }

  dispose() {
    this.threeEditor?.dispose();
    this.threeEditor = undefined;
  }
}
