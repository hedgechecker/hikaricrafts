import * as THREE from 'three';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import { AddPointCommand } from '../../commands/AddPointCommand ';
import { AddLineCommand } from '../../commands/AddLineCommand';
import { generateId } from '../../utils/id';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/Addons.js';

export class LineTool implements Tool {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private lastPointId: string | null = null;
  private previewLine: Line2 | null = null;
  private snapTargetId: string | null = null;

  private snapDistance = 0.3;
  private isShiftPressed = false;

  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private editor: ThreeEditor;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    editor: ThreeEditor,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.editor = editor;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  // --------------------------------------------------

  private getWorldPosition(event: MouseEvent): THREE.Vector3 {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection;
  }

  // --------------------------------------------------

  onMouseDown(event: MouseEvent) {
    if (event.button === 2) {
      this.cancelLine();
      return;
    }

    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    let worldPos = this.getWorldPosition(event);

    if (this.isShiftPressed && this.lastPointId) {
      const last = this.editor.getPointWorldPosition(this.lastPointId);
      if (last) worldPos = this.snapAngle(last, worldPos);
    }

    let currentPointId: string;

    // Snap to existing point
    if (this.snapTargetId) {
      currentPointId = this.snapTargetId;
    } else {
      currentPointId = generateId();

      this.editor.executeCommand(
        new AddPointCommand({
          id: currentPointId,
          x: worldPos.x,
          y: worldPos.y,
          z: worldPos.z,
        }),
      );
    }

    // Create line if we already had a previous point
    if (this.lastPointId && currentPointId !== this.lastPointId) {
      this.editor.executeCommand(
        new AddLineCommand(generateId(), this.lastPointId, currentPointId),
      );
    }

    this.lastPointId = currentPointId;

    if (!this.previewLine) this.createPreviewLine();
  }

  // --------------------------------------------------

  onMouseMove(event: MouseEvent) {
    this.editor.handleHover(event);
    const worldPos = this.getWorldPosition(event);

    const zoom = (this.camera as THREE.OrthographicCamera).zoom;
    const threshold = this.snapDistance / zoom;

    const snapCandidates = this.editor.getSnapCandidates(worldPos, threshold);

    let endPosition = worldPos;

    if (snapCandidates.length > 0 && snapCandidates[0] !== this.lastPointId) {
      this.snapTargetId = snapCandidates[0];
      const pos = this.editor.getPointWorldPosition(snapCandidates[0]);
      if (pos) endPosition = pos;
    } else {
      this.snapTargetId = null;
      this.editor.clearHover();

      if (this.isShiftPressed && this.lastPointId) {
        const last = this.editor.getPointWorldPosition(this.lastPointId);
        if (last) endPosition = this.snapAngle(last, worldPos);
      }
    }

    if (!this.lastPointId || !this.previewLine) return;

    const start = this.editor.getPointWorldPosition(this.lastPointId);
    if (!start) return;
    this.previewLine.geometry.setFromPoints([start.clone(), endPosition.clone()]);
  }

  // --------------------------------------------------

  private createPreviewLine() {
    const geometry = new LineGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

    const material = new LineMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });

    material.resolution.set(this.domElement.clientWidth, this.domElement.clientHeight);

    this.previewLine = new Line2(geometry, material);
    this.previewLine.computeLineDistances();
    this.scene.add(this.previewLine);
  }

  private cancelLine() {
    this.lastPointId = null;
    this.snapTargetId = null;

    if (this.previewLine) {
      this.scene.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      (this.previewLine.material as THREE.Material).dispose();
      this.previewLine = null;
    }
  }

  private snapAngle(start: THREE.Vector3, target: THREE.Vector3) {
    const dir = target.clone().sub(start);
    const angle = Math.atan2(dir.y, dir.x);
    const distance = dir.length();

    const snapIncrement = Math.PI / 8;
    const snappedAngle = Math.round(angle / snapIncrement) * snapIncrement;

    return start
      .clone()
      .add(
        new THREE.Vector3(Math.cos(snappedAngle) * distance, Math.sin(snappedAngle) * distance, 0),
      );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') this.isShiftPressed = true;
    if (e.key === 'Escape') this.cancelLine();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') this.isShiftPressed = false;
  };

  dispose() {
    this.cancelLine();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
