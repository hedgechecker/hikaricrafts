import { SceneManager } from "./SceneManager";
import { BackgroundImage } from "./BackgroundImage";
import { enablePanZoom } from "./controls";

export class ThreeEditor {
  private sceneManager: SceneManager;
  private background: BackgroundImage;

  constructor(container: HTMLDivElement) {
    this.sceneManager = new SceneManager(container);
    this.background = new BackgroundImage(this.sceneManager.scene);

    enablePanZoom(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement
    );

    this.sceneManager.start();
  }

  setBackgroundImage(url: string) {
    this.background.setImage(url);
  }

  dispose() {
    this.sceneManager.dispose();
  }
}
