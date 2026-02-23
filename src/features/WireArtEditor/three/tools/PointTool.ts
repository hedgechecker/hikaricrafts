import * as THREE from 'three';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import { AddPointCommand } from '../../commands/AddPointCommand ';
import { generateId } from '../../utils/id';

export class PointTool implements Tool {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private downPosition: [number, number] = [0, 0];
  private placementBlocked = false;

  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private editor: ThreeEditor;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    editor: ThreeEditor,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    this.downPosition = [event.clientX, event.clientY];
  }

  onMouseUp(event: MouseEvent): void {
    const moved =
      Math.abs(this.downPosition[0] - event.clientX) > 0.5 ||
      Math.abs(this.downPosition[1] - event.clientY) > 0.5;

    if (moved || this.placementBlocked || this.editor.getHoveredPoint()) return;

    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.plane, intersection);

    if (!hit) return;

    this.editor.executeCommand(
      new AddPointCommand({
        id: generateId(),
        x: intersection.x,
        y: intersection.y,
        z: intersection.z,
      }),
    );

    this.placementBlocked = true;
  }

  onMouseMove(event: MouseEvent) {
    this.placementBlocked = false;
    this.editor.handleHover(event);
  }
}
