import * as THREE from "three";
import type { Tool } from "./Tool";
import { PointManager } from "../objects/PointManager";
import type { CameraController } from "../core/CameraController";
import { CursorManager } from "../objects/CursorManager";

export class MoveTool implements Tool {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private pointManager: PointManager;
  private cursorManager: CursorManager;
  private CameraController: CameraController;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private selectedPoint: THREE.Group | null = null;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    pointManager: PointManager,
    cursorManager: CursorManager,
    CameraController: CameraController
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.pointManager = pointManager;
    this.cursorManager = cursorManager;
    this.CameraController = CameraController;
  }

  private updateMouse(event: MouseEvent) {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    this.mouse.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onMouseDown() {
    const point = this.pointManager.getHovered();
    if(!point) return;
    this.selectedPoint = point;
    this.CameraController.setPanEnabled(false);
    this.cursorManager.setCursor("grabbing");
  }

  onMouseMove(event: MouseEvent) {
    if (!this.selectedPoint) {
      const rect = this.domElement.getBoundingClientRect();

      this.mouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      this.mouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(
        this.pointManager.getHitboxes(),
        false
      );

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const group = hitObject.parent as THREE.Group;
        this.pointManager.setHovered(group);
        this.cursorManager.setCursor("pointer");
      } else {
        this.pointManager.setHovered(null);
        this.cursorManager.setCursor("default");
      }
      return;
    }

    this.updateMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    this.selectedPoint.position.copy(intersection);
  }

  onMouseUp() {
    if (this.selectedPoint) {
      this.CameraController.setPanEnabled(true);
    }
    this.selectedPoint = null;
    this.cursorManager.setCursor("default");
  }
}
