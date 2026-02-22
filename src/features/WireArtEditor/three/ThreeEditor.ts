import { SceneManager } from './SceneManager';
import { PointManager } from './objects/PointManager';
import { PointTool } from './tools/PointTool';
import { MoveTool } from './tools/MoveTool';
import { ToolManager } from './tools/ToolManager';
import type { Tool } from './tools/Tool';
import { CursorManager } from './objects/CursorManager';
import { LineTool } from './tools/LineTool';
import { LineManager } from './objects/LineManager';
import { DataStorage } from '../core/DataStorage';

export type ToolType = 'point' | 'move' | 'line';

export class ThreeEditor {
  private sceneManager: SceneManager;
  private pointManager: PointManager;
  private toolManager: ToolManager;
  private cursorManager: CursorManager;
  private lineManager: LineManager;
  private storage: DataStorage;

  private pointTool: PointTool;
  private moveTool: MoveTool;
  private lineTool: LineTool;

  private isShiftPressed = false;

  constructor(container: HTMLDivElement) {
    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.storage = new DataStorage();

    this.pointManager = new PointManager(this.sceneManager.scene);
    this.lineManager = new LineManager(this.sceneManager.scene);

    this.lineTool = new LineTool(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.pointManager,
      this.lineManager,
    );
    this.toolManager = new ToolManager(this.sceneManager.renderer.domElement);

    this.pointTool = new PointTool(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.pointManager,
      this.cursorManager,
    );
    this.moveTool = new MoveTool(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.pointManager,
      this.cursorManager,
      this.sceneManager.getCameraController(),
    );
    this.toolManager.setTool(this.moveTool);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.load('X');
    this.start();
  }

  load(projectname: string) {
    this.storage.loadFromLocal(projectname);
    if (this.storage.getBackground())
      this.setBackgroundImage(this.storage.getBackground() as string);
  }

  start() {
    const animate = () => {
      const { renderer, scene, camera } = this.sceneManager;
      renderer.render(scene, camera);
      // Keep points constant sizepoints
      this.pointManager.updateScale(camera.zoom);
      this.lineManager.update();
      requestAnimationFrame(animate);
    };
    animate();
  }

  setBackgroundImage(url: string) {
    this.sceneManager.setBackgroundImage(url);
    this.storage.setBackground(url);
  }

  setTool(tool: Tool | null) {
    this.toolManager.setTool(tool);
  }

  setActiveTool(type: ToolType) {
    if (type === 'point') {
      this.toolManager.setTool(this.pointTool);
    }

    if (type === 'move') {
      this.toolManager.setTool(this.moveTool);
    }
    if (type === 'line') {
      this.toolManager.setTool(this.lineTool);
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    if (e.key === 'Control') {
      this.isShiftPressed = true;
    }
    if (this.isShiftPressed && e.key === 's') {
      console.log('saved');
      this.storage.saveToLocal('X');
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control') {
      this.isShiftPressed = false;
    }
  };

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
