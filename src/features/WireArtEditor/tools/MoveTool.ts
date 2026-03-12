import * as THREE from 'three';
import type { Tool } from './Tool';
import { CursorManager } from '../objects/CursorManager';
import type { CameraController } from '../objects/CameraController';
import { UpdatePointCommand } from '../commands/UpdatePointCommand';
import { MergePointsCommand } from '../commands/MergePointsCommand';
import type { ThreeEditor } from '../core/ThreeEditor';

export class MoveTool implements Tool {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private selectedPoint: string | null = null;
  private startPosition: THREE.Vector3 | null = null;
  private currentPosition: THREE.Vector3 | null = null;

  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private cursorManager: CursorManager;
  private cameraController: CameraController;
  private editor: ThreeEditor;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    cursorManager: CursorManager,
    cameraController: CameraController,
    editor: ThreeEditor,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.cursorManager = cursorManager;
    this.cameraController = cameraController;
    this.editor = editor;
  }

  private updateMouse(event: MouseEvent) {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onMouseDown() {
    const hovered = this.editor.getHoveredPoint();
    if (!hovered) return;

    this.selectedPoint = hovered;
    if (!this.startPosition) this.startPosition = new THREE.Vector3(0, 0, 0);
    this.startPosition.copy(this.editor.getPointWorldPosition(this.selectedPoint) as THREE.Vector3);
    this.editor.setSelected([this.selectedPoint]);

    this.cameraController.setPanEnabled(false);
    this.cursorManager.setCursor('grabbing');
  }

  onMouseMove(event: MouseEvent) {
    this.editor.handleHover(event);
    if (!this.selectedPoint) {
      return;
    }

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.plane, intersection);

    if (!hit) return;
    if (!this.currentPosition) this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.currentPosition.copy(intersection);
    this.editor.previewMovePoint(this.selectedPoint, this.currentPosition);
  }

  onMouseUp() {
    this.editor.clearPreview();
    if (!this.selectedPoint || !this.startPosition || !this.currentPosition) {
      console.log('missin');
      this.cameraController.setPanEnabled(true);
      this.selectedPoint = null;
      this.startPosition = null;
      this.currentPosition = null;
      this.editor.setSelected([]);
      this.cursorManager.setCursor('default');
      return;
    }
    var endPosition = this.currentPosition;

    if (!this.currentPosition.equals(this.startPosition)) {
      const hovered = this.editor.getHoveredPoint();
      if (hovered && hovered != this.selectedPoint) {
        this.editor.executeCommand(new MergePointsCommand(this.selectedPoint, hovered));
        this.editor.setHovered(hovered);
      } else {
        const point = this.editor.getHoveredGridPoint();
        if (point) {
          endPosition.copy(point);
        }
        this.editor.executeCommand(
          new UpdatePointCommand({
            id: this.selectedPoint,
            x: endPosition.x,
            y: endPosition.y,
            z: endPosition.z,
          }),
        );
        this.editor.setHovered(this.selectedPoint);
      }
    }

    this.cameraController.setPanEnabled(true);
    this.selectedPoint = null;
    this.startPosition = null;
    this.currentPosition = null;
    this.editor.setSelected([]);
    this.cursorManager.setCursor('default');
  }
}
