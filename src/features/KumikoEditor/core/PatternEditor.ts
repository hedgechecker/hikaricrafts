import { SceneManager } from "../objects/SceneManager";
import { CursorManager } from "../objects/CursorManager";
import { OrthographicCamera } from "three";
import { DataStorage } from "./DataStorage";
import * as THREE from "three";
import { createPattern } from "../utils/patternCreation";
import type { EditorStore } from "./EditorStore";
import type { patternType } from "../models/Pattern";
import type { Project } from "../models/Project";

export class PatternEditor {
  public sceneManager: SceneManager;
  private cursorManager: CursorManager;
  private container: HTMLDivElement;
  private pattern: THREE.Group |null = null;
  private project: Project;

  constructor(container: HTMLDivElement, store: EditorStore) {
    this.container = container;
    store.subscribe(() => {this.setPattern(store.getState().selectedPattern)});

    const storage = new DataStorage();
    this.project = storage.getEmptyProject();
    this.cursorManager = new CursorManager(this.container);
    this.cursorManager.setCursor("default");
    this.sceneManager = new SceneManager(this.container, this.project.settings);
    this.sceneManager.setCameraMode("3D");

    this.setPattern("Gomagara");
    const outline = createPattern(
      {
        id: "outline",
        pos: { x: 0, y: 0, z: -9, rotation: 0 },
        patternType: "Outline",
        materialMap: [],
      },
      this.project.settings,
      true,
    );
    outline.position.z = -9;
    this.sceneManager.scene.add(outline);

    const camera = this.sceneManager.camera;
    const controls = this.sceneManager.controller;

    camera.lookAt(0, 0, 0);
    camera.position.set(0, 0, 10);
    camera.zoom = 0.9;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI * (1 / 4);
    controls.maxAzimuthAngle = Math.PI * (1 / 4);

    window.addEventListener("keydown", this.onKeyDown);
    this.start();
  }

  start() {
    let lastZoom = 0;
    const { camera } = this.sceneManager;
    const animate = () => {
      this.sceneManager.update();
      if (camera instanceof OrthographicCamera && camera.zoom != lastZoom) {
        lastZoom = camera.zoom;
      }
    };
    animate();
  }

  resize(container: HTMLDivElement) {
    this.container = container;
    this.sceneManager.container = container;
    this.sceneManager.onResize();
  }

  private onKeyDown = async (e: KeyboardEvent) => {
    if(e.key == "E"){
        console.log("Next");
    }
  };

  private setPattern(type: patternType){
    if(this.pattern){
      this.sceneManager.scene.remove(this.pattern);
    }
    this.pattern = createPattern(
      {
        id: "pattern",
        pos: { x: 0, y: 0, z: -9, rotation: 0 },
        patternType: type,
        materialMap: [],
      },
      this.project.settings,
    );
    this.pattern.position.z = -9;
    this.sceneManager.scene.add(this.pattern);
    this.sceneManager.update();
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    this.sceneManager.dispose();
  }
}
