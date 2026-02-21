import * as THREE from 'three';
import type { Tool } from './Tool';
import { PointManager } from '../objects/PointManager';
import { LineManager } from '../objects/LineManager';

export class LineTool implements Tool {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private pointManager: PointManager;
  private lineManager: LineManager;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private lastPoint: THREE.Group | null = null;
  private previewLine: THREE.Line | null = null;
  private snapTarget: THREE.Group | null = null;
  private snapDistance = 0.3; // world units
  private isShiftPressed = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    pointManager: PointManager,
    lineManager: LineManager,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.pointManager = pointManager;
    this.lineManager = lineManager;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private getWorldPosition(event: MouseEvent): THREE.Vector3 {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection;
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 2) {
      this.cancelLine();
      return;
    }

    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    let worldPos;
    if (this.isShiftPressed && this.lastPoint) {
      worldPos = this.snapAngle(this.lastPoint.position, this.getWorldPosition(event));
    } else {
      worldPos = this.getWorldPosition(event);
    }

    let newPoint: THREE.Group;

    if (this.snapTarget) {
      newPoint = this.snapTarget;
    } else {
      newPoint = this.pointManager.addPoint(worldPos);
    }

    if (this.lastPoint && newPoint !== this.lastPoint) {
      this.lineManager.addLine(this.lastPoint, newPoint);
    }

    this.lastPoint = newPoint;

    if (!this.previewLine) {
      this.createPreviewLine();
    }
  }

  private createPreviewLine() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);

    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });

    this.previewLine = new THREE.Line(geometry, material);
    this.scene.add(this.previewLine);
  }

  private cancelLine() {
    this.lastPoint = null;
    this.snapTarget = null;

    if (this.previewLine) {
      this.scene.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      (this.previewLine.material as THREE.Material).dispose();
      this.previewLine = null;
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.lastPoint || !this.previewLine) return;

    const worldPos = this.getWorldPosition(event);

    // Adjust snap distance based on zoom
    const zoom = (this.camera as THREE.OrthographicCamera).zoom;
    const threshold = this.snapDistance / zoom;

    const snapCandidate = this.pointManager.getSnapCandidate(worldPos, threshold);

    let endPosition = worldPos;

    //Snap to existing point
    if (snapCandidate && snapCandidate !== this.lastPoint) {
      this.snapTarget = snapCandidate;
      endPosition = snapCandidate.position;

      this.pointManager.setHovered(snapCandidate);
    } else {
      this.snapTarget = null;
      this.pointManager.setHovered(null);

      //Angle snapping (only if not snapping to point)
      if (this.isShiftPressed && this.lastPoint) {
        endPosition = this.snapAngle(this.lastPoint.position, worldPos);
      }
    }

    this.previewLine.geometry.setFromPoints([this.lastPoint.position.clone(), endPosition.clone()]);
  }
  onMouseUp() {}

  private snapAngle(start: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 {
    const dir = target.clone().sub(start);

    const angle = Math.atan2(dir.y, dir.x);
    const distance = dir.length();

    const snapIncrement = Math.PI / 8; // 22.5°
    const snappedAngle = Math.round(angle / snapIncrement) * snapIncrement;

    const snapped = new THREE.Vector3(
      Math.cos(snappedAngle) * distance,
      Math.sin(snappedAngle) * distance,
      0,
    );

    return start.clone().add(snapped);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = false;
    }
  };

  dispose(): void {
    this.cancelLine();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
