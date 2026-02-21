import { SceneManager } from './SceneManager';
import { BackgroundImage } from './BackgroundImage';
import { PointManager } from './objects/PointManager';
import { PointTool } from './tools/PointTool';
import { MoveTool } from './tools/MoveTool';
import { ToolManager } from './tools/ToolManager';
import type { Tool } from './tools/Tool';
import { CursorManager } from './objects/CursorManager';
import { LineTool } from './tools/LineTool';
import { LineManager } from './objects/LineManager';

export type ToolType = 'point' | 'move' | 'line';

export class ThreeEditor {
  private sceneManager: SceneManager;
  private background: BackgroundImage;
  private pointManager: PointManager;
  private toolManager: ToolManager;
  private cursorManager: CursorManager;
  private lineManager: LineManager;

  private pointTool: PointTool;
  private moveTool: MoveTool;
  private lineTool: LineTool;

  constructor(container: HTMLDivElement) {
    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.background = new BackgroundImage(this.sceneManager.scene);

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
    this.start();
  }

  start() {
    const animate = () => {
      const { renderer, scene, camera } = this.sceneManager;
      renderer.render(scene, camera);
      // Keep points constant size
      this.pointManager.updateScale(camera.zoom);
      this.lineManager.update();
      requestAnimationFrame(animate);
    };
    animate();
  }

  setBackgroundImage(url: string) {
    this.background.setImage(url);
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

  dispose() {
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
