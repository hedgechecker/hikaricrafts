import * as THREE from 'three';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import { AddPointCommand } from '../../commands/AddPointCommand ';
import { generateId } from '../../utils/id';
import { AddLineCommand } from '../../commands/AddLineCommand';
import { DeleteLineCommand } from '../../commands/DeleteLineCommand';
import { CompositeCommand } from '../../commands/CompositeCommand';
import { projectPointToSegment } from '../../utils/math';

export class PointTool implements Tool {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private downPosition: [number, number] = [0, 0];
  private placementBlocked = false;

  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private editor: ThreeEditor;

  constructor(camera: THREE.Camera, domElement: HTMLElement, editor: ThreeEditor) {
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

    let intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.plane, intersection);
    if (!hit) return;

    const hoveredLine = this.editor.getHoveredLine();
    if (hoveredLine) {
      const aPos = this.editor.getPointWorldPosition(hoveredLine.startId);
      const bPos = this.editor.getPointWorldPosition(hoveredLine.endId);
      if (!aPos || !bPos) return;

      const a = aPos.clone();
      const b = bPos.clone();

      // ---- PROJECT CLICK ONTO LINE ----
      intersection = projectPointToSegment(intersection, a, b);

      const newPointId = generateId();

      const newPoint = {
        id: newPointId,
        x: intersection.x,
        y: intersection.y,
        z: intersection.z,
      };

      // prevent splitting exactly at endpoints
      if (intersection.distanceTo(a) < 0.001 || intersection.distanceTo(b) < 0.001) {
        return;
      }

      const splitCommand = new CompositeCommand([
        new AddPointCommand(newPoint),
        new DeleteLineCommand(hoveredLine.id),
        new AddLineCommand(generateId(), hoveredLine.startId, newPointId),
        new AddLineCommand(generateId(), newPointId, hoveredLine.endId),
      ]);

      this.editor.executeCommand(splitCommand);

      this.placementBlocked = true;
      return;
    }

    const point = this.editor.getHoveredGridPoint();
    if (point) {
      intersection = point;
    }

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
