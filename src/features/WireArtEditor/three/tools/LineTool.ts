import * as THREE from 'three';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import { AddPointCommand } from '../../commands/AddPointCommand ';
import { AddLineCommand } from '../../commands/AddLineCommand';
import { generateId } from '../../utils/id';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/Addons.js';
import { projectPointToSegment } from '../../utils/math';
import { CompositeCommand } from '../../commands/CompositeCommand';
import { DeleteLineCommand } from '../../commands/DeleteLineCommand';

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

    let worldPos = this.getWorldPosition(event);
    const point = this.editor.getHoveredGridPoint();

    if (this.isShiftPressed && this.lastPointId) {
      const last = this.editor.getPointWorldPosition(this.lastPointId);
      if (last) worldPos = this.snapAngle(last, worldPos);
    } else if (point) {
      worldPos = point;
    }

    let currentPointId: string;

    const hoveredLine = this.editor.getHoveredLine();
    // Snap to existing point
    if (this.snapTargetId) {// when hovering an existing Point
      currentPointId = this.snapTargetId;
    } else if(hoveredLine){//Add a new Point on an existing line
      const aPos = this.editor.getPointWorldPosition(hoveredLine.startId);
      const bPos = this.editor.getPointWorldPosition(hoveredLine.endId);
      if (!aPos || !bPos) return;

      const a = aPos.clone();
      const b = bPos.clone();
      worldPos = projectPointToSegment(worldPos, a, b);

      const newPointId = generateId();

      const newPoint = {
        id: newPointId,
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
      };

      // prevent splitting exactly at endpoints
      if (worldPos.distanceTo(a) < 0.001 || worldPos.distanceTo(b) < 0.001) {
        return;
      }

      const splitCommand = new CompositeCommand([
        new AddPointCommand(newPoint),
        new DeleteLineCommand(hoveredLine.id),
        new AddLineCommand(generateId(), hoveredLine.startId, newPointId),
        new AddLineCommand(generateId(), newPointId, hoveredLine.endId),
      ]);
      currentPointId = newPoint.id;
      this.editor.executeCommand(splitCommand);
    }else {//when clicking somewhere, where nothing snaps to it
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
    if (
      this.lastPointId &&
      currentPointId !== this.lastPointId &&
      !this.editor.hasLineBetween(this.lastPointId, currentPointId)
    ) {
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
    const distance = dir.length();

    let baseAngle = Math.atan2(dir.y, dir.x);

    const candidateAngles: number[] = [];

    // -------------------------
    // 1. Global snapping (45°)
    // -------------------------
    const increment = Math.PI / 4;
    candidateAngles.push(Math.round(baseAngle / increment) * increment);

    // -------------------------
    // 2. Relative snapping
    // -------------------------
    if (this.lastPointId) {
      const connectedPoints = this.editor.getConnectedPoints(this.lastPointId);

      for (const point of connectedPoints) {
        const otherPos = this.editor.getPointWorldPosition(point);

        if (!otherPos) continue;

        const lineDir = otherPos.clone().sub(start);
        const lineAngle = Math.atan2(lineDir.y, lineDir.x);

        // parallel
        candidateAngles.push(lineAngle);
        candidateAngles.push(lineAngle + Math.PI);

        // perpendicular
        candidateAngles.push(lineAngle + Math.PI / 2);
        candidateAngles.push(lineAngle - Math.PI / 2);
      }
    }

    // -------------------------
    // 3. Pick closest angle
    // -------------------------
    let bestAngle = candidateAngles[0];
    let smallestDiff = Infinity;

    for (const candidate of candidateAngles) {
      const diff = Math.abs(
        THREE.MathUtils.euclideanModulo(baseAngle - candidate + Math.PI, Math.PI * 2) - Math.PI,
      );

      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestAngle = candidate;
      }
    }

    // -------------------------
    // 4. Apply snap
    // -------------------------
    return start
      .clone()
      .add(new THREE.Vector3(Math.cos(bestAngle) * distance, Math.sin(bestAngle) * distance, 0));
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
  }
}
