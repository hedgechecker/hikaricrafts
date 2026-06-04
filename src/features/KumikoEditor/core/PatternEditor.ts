import { SceneManager } from "../objects/SceneManager";
import { CursorManager } from "../objects/CursorManager";
import { OrthographicCamera } from "three";
import { DataStorage } from "./DataStorage";
import * as THREE from "three";
import { createPattern } from "../utils/patternCreation";
import type { EditorStore } from "./EditorStore";
import type { patternType, woodType } from "../models/Pattern";
import type { Project } from "../models/Project";
import { getFastMaterial } from "../utils/materials";

export class PatternEditor {
  public sceneManager: SceneManager;
  private cursorManager: CursorManager;
  private container: HTMLDivElement;
  private pattern: THREE.Group | null = null;
  private project: Project;
  private store: EditorStore;
  private lastIndex: number | null = null;
  private lasPos: THREE.Vector2 = new THREE.Vector2();
  private materialMap: Array<{ woodType: woodType; thickness: number }> = [];

  constructor(container: HTMLDivElement, store: EditorStore) {
    this.container = container;
    this.store = store;
    store.subscribe(() => {
      this.setPattern(store.getState().selectedPattern);
    });

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

    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

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

  private setPattern(type: patternType) {
    if (this.pattern) {
      this.sceneManager.scene.remove(this.pattern);
    }
    this.pattern = createPattern(
      {
        id: "pattern",
        pos: { x: 0, y: 0, z: -9, rotation: 0 },
        patternType: type,
        materialMap: this.materialMap,
      },
      this.project.settings,
    );
    this.pattern.position.z = -9;
    this.sceneManager.scene.add(this.pattern);
    this.sceneManager.update();
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.pattern) return;
    const elements = this.pattern.children;
    const selectedWood = this.store.getState().selectedWood;

    const rect = this.sceneManager.dom.getBoundingClientRect();
    const raycaster = new THREE.Raycaster();

    var mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);

    var closestDist = Number.MAX_SAFE_INTEGER;
    var closest = -1;

    for (var i = 0; i < elements.length; i++) {
      const element = elements.at(i) as THREE.Object3D;
      const intersects = raycaster.intersectObject(element);
      if (
        element.name != "hitbox" &&
        intersects.length > 0 &&
        intersects[0].distance < closestDist
      ) {
        closestDist = intersects[0].distance;
        closest = i;
      }
    }

    if (closest >= 0) {
      if (closest === this.lastIndex) {
        return;
      }
      const element = elements.at(closest) as THREE.Object3D;
      if (!(element as THREE.Mesh).isMesh) return;
      const mesh = element as THREE.Mesh;
      if (this.lastIndex != null)
        (elements.at(this.lastIndex) as THREE.Mesh).material = getFastMaterial(
          this.materialMap[this.lastIndex]?.woodType,
        );
      mesh.material = getFastMaterial(selectedWood, true);
      this.sceneManager.render();

      this.lastIndex = closest;
      return;
    }
    if (this.lastIndex != null) {
      (elements.at(this.lastIndex) as THREE.Mesh).material = getFastMaterial(
        this.materialMap[this.lastIndex]?.woodType,
      );
      this.sceneManager.render();
      this.lastIndex = null;
    }
  };
  private onMouseDown = (event: MouseEvent) => {
    this.lasPos.x = event.clientX;
    this.lasPos.y = event.clientY;
  };

  private onMouseUp = (event: MouseEvent) => {
    if (
      !this.pattern ||
      Math.abs(event.clientX - this.lasPos.x) > 2 ||
      Math.abs(event.clientY - this.lasPos.y) > 2
    ) {
      return;
    }
    const elements = this.pattern.children;
    const selectedWood = this.store.getState().selectedWood;
    if (this.lastIndex != null) {
      if(!this.materialMap[this.lastIndex]){
        this.materialMap[this.lastIndex] = {woodType: selectedWood, thickness: 3};
      }else {
        this.materialMap[this.lastIndex].woodType = selectedWood;
      }
      (elements.at(this.lastIndex) as THREE.Mesh).material = getFastMaterial(
        this.materialMap[this.lastIndex]?.woodType,
      );

      this.store.setMaterialMap(this.materialMap);
      this.lastIndex = null;
    }
  };

  dispose() {
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.sceneManager.dispose();
  }
}
