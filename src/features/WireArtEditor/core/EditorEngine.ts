import type { Settings } from '../models/Settings.ts';
import { ThreeEditor } from './ThreeEditor.ts';
import { EditorStore } from './EditorStore.ts';
import type { ToolType } from '../tools/ToolManager.ts';

export class EditorEngine {
  private threeEditor?: ThreeEditor;
  store = new EditorStore();

  constructor() {}

  initialize(container: HTMLDivElement) {
    if (this.threeEditor) return; // prevent double mount

    this.threeEditor = new ThreeEditor(container);
    this.threeEditor.start();
    const project = this.threeEditor?.getProject();
    if (project) {
      this.store.setProject(project);
    }
  }

  setActiveTool(type: ToolType) {
    this.threeEditor?.setActiveTool(type);
  }
  addBackgroundImage(url: string) {
    this.threeEditor?.addBackgroundImage(url);
  }

  getStore() {
    return this.store;
  }

  async loadGlobal(id: number) {
    await this.threeEditor?.loadGlobal(id);
    const project = this.threeEditor?.getProject();
    if (project) {
      this.store.setProject(project);
    }
  }

  save() {
    this.threeEditor?.save();
  }

  exportSVG() {
    return this.threeEditor?.exportSVG();
  }

  openNewProject() {
    this.threeEditor?.load(null);
  }

  hasChanges() {
    return this.threeEditor?.hasChanges;
  }

  updateSettings(settings: Settings) {
    this.store.updateSettings(settings);
    if (!this.threeEditor) return;
    this.threeEditor.setSettings(settings);
    this.threeEditor.hasChanges = true;
  }

  dispose() {
    this.threeEditor?.dispose();
    this.threeEditor = undefined;
  }
}
