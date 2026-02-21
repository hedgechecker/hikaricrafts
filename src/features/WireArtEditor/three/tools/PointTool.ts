import * as THREE from 'three';
import type { Tool } from './Tool';
import { PointManager } from '../objects/PointManager';
import type { CursorManager } from '../objects/CursorManager';

export class PointTool implements Tool {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private pointManager: PointManager;
  private cursorManager: CursorManager;
  private position: number[] = [];
  private placementBlocked = false;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    pointManager: PointManager,
    cursorManager: CursorManager,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.pointManager = pointManager;
    this.cursorManager = cursorManager;
  }

  onMouseDown(event: MouseEvent): void {
    this.position[0] = event.clientX;
    this.position[1] = event.clientY;
  }

  onMouseUp(event: MouseEvent): void {
    if (
      Math.abs(this.position[0] - event.clientX) > 0.5 ||
      Math.abs(this.position[1] - event.clientY) > 0.5 ||
      this.pointManager.getHovered() != null ||
      this.placementBlocked
    ) {
      return;
    }
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    this.pointManager.addPoint(intersection);
    this.placementBlocked = true;
  }

  onMouseMove(event: MouseEvent) {
    this.placementBlocked = false;
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pointManager.getHitboxes(), false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const group = hitObject.parent as THREE.Group;
      this.pointManager.setHovered(group);
      this.cursorManager.setCursor('pointer');
    } else {
      this.pointManager.setHovered(null);
      this.cursorManager.setCursor('default');
    }
    return;
  }
}
