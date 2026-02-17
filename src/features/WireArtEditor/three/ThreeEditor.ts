import { SceneManager } from "./SceneManager";
import { BackgroundImage } from "./BackgroundImage";
import { enablePanZoom } from "./controls";
import { PointManager } from "./objects/PointManager";
import { PointTool } from "./tools/PointTool";
import { ToolManager } from "./tools/ToolManager";
import type { Tool } from "./tools/Tool";

export class ThreeEditor {
  private sceneManager: SceneManager;
  private background: BackgroundImage;
  private pointManager: PointManager;
  private toolManager: ToolManager;

  constructor(container: HTMLDivElement) {
    this.sceneManager = new SceneManager(container);
    this.background = new BackgroundImage(this.sceneManager.scene);
    this.pointManager = new PointManager(
      this.sceneManager.scene
    );
    this.toolManager = new ToolManager(
      this.sceneManager.renderer.domElement
    );

    enablePanZoom(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement
    );
    const pointTool = new PointTool(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.pointManager
    );
    this.toolManager.setTool(pointTool);
    this.start();
  }

  start() {
    const animate = () => {
      const { renderer, scene, camera } = this.sceneManager;
      renderer.render(scene, camera);
      // Keep points constant size
      this.pointManager.updateScale(camera.zoom);
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
  
  dispose() {
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
