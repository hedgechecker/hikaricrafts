import * as THREE from 'three';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import { AddPointCommand } from '../../commands/AddPointCommand ';
import { AddLineCommand } from '../../commands/AddLineCommand';
import { generateId } from '../../utils/id';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/Addons.js';
import {  projectPointToSegment, snapAngle } from '../../utils/math';
import { CompositeCommand } from '../../commands/CompositeCommand';
import { DeleteLineCommand } from '../../commands/DeleteLineCommand';
import { InputOverlay } from './InputOverlay';

export class LineTool implements Tool {
  private lastPointId: string | null = null;
  private previewLine: Line2 | null = null;
  private snapTargetId: string | null = null;
  private snapPosition: THREE.Vector3 | null = null;

  private snapDistance = 0.3;
  private isShiftPressed = false;

  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private editor: ThreeEditor;

  private inputOverlay: InputOverlay;
  private lastMouseWorld = new THREE.Vector3();

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

    this.inputOverlay = new InputOverlay(this.domElement.parentElement!, () =>
      this.handleMouseMove(),
    );

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onMouseDown(event: MouseEvent) {
    //right mouse button
    if (event.button === 2) {
      this.cancelLine();
      return;
    }
    //do nothing on every other button, than left mouse click
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    let worldPos = this.editor.getWorldPosition(event);
    let snapCandidate = this.getBestSnappingCandidate(worldPos);

    this.inputOverlay.reset();
    this.inputOverlay.show(event.clientX, event.clientY);
    this.inputOverlay.focus();

    let currentPointId: string | null = null;

    if (snapCandidate.pointId) {
      currentPointId = snapCandidate.pointId;
    } else if (snapCandidate.line) {
      let Id = this.splitLine(
        worldPos,
        snapCandidate.line.id,
        snapCandidate.line.startId,
        snapCandidate.line.endId,
      );
      currentPointId = Id;
    } else if (snapCandidate.position) {
      //when clicking somewhere, where nothing snaps to it
      currentPointId = generateId();
      this.editor.executeCommand(
        new AddPointCommand({
          id: currentPointId,
          x: snapCandidate.position.x,
          y: snapCandidate.position.y,
          z: snapCandidate.position.z,
        }),
      );
    }

    //Line between lastPoint and current Point
    if (
      this.lastPointId &&
      currentPointId &&
      currentPointId !== this.lastPointId &&
      !this.editor.hasLineBetween(this.lastPointId, currentPointId)
    ) {
      this.editor.executeCommand(
        new AddLineCommand(generateId(), this.lastPointId, currentPointId),
      );
    }

    this.lastPointId = currentPointId;
    if (!this.previewLine) {
      this.createPreviewLine();
    }
  }

  /**Snapping Logic Most Important to least Important:
    1. Snap to User Input Values
    2. Snap to existing Points
    3. Snap to existing Lines
    4. Snap to next grid Point
    5. Snap Angle 
    6. return given Position
  **/
  private getBestSnappingCandidate(worldPos: THREE.Vector3): {
    pointId: string | null;
    line: { id: string; endId: string; startId: string } | null;
    position: THREE.Vector3 | null;
  } {
    //1
    const hasUserInputLength =
      (this.inputOverlay.manualAngle || this.inputOverlay.manualLength) &&
      this.lastPointId &&
      this.snapPosition;
    if (hasUserInputLength) {
      return { pointId: null, line: null, position: this.snapPosition };
    }
    //2
    if (this.snapTargetId) return { pointId: this.snapTargetId, line: null, position: null };
    //3
    const hoveredLine = this.editor.getHoveredLine();
    if (hoveredLine) {
      return { pointId: null, line: hoveredLine, position: null };
    }
    //4
    const snapGridPoint = this.editor.getHoveredGridPoint();
    if (snapGridPoint) {
      return { pointId: null, line: null, position: snapGridPoint };
    }
    //5
    if (this.isShiftPressed && this.lastPointId) {
      const last = this.editor.getPointWorldPosition(this.lastPointId);
      if (last) worldPos = snapAngle(last, worldPos, this.getConnectedPositions());
      return { pointId: null, line: null, position: worldPos };
    }
    //6
    return { pointId: null, line: null, position: worldPos };
  }

  private splitLine(worldPos: THREE.Vector3, id: string, startId: string, endId: string) {
    //Add a new Point on an existing line
    const aPos = this.editor.getPointWorldPosition(startId);
    const bPos = this.editor.getPointWorldPosition(endId);
    if (!aPos || !bPos) return null;

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
      return null;
    }

    const splitCommand = new CompositeCommand([
      new AddPointCommand(newPoint),
      new DeleteLineCommand(id),
      new AddLineCommand(generateId(), startId, newPointId),
      new AddLineCommand(generateId(), newPointId, endId),
    ]);
    this.editor.executeCommand(splitCommand);
    return newPointId as string;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.lastPointId) this.inputOverlay.hide();

    this.editor.handleHover(event);
    const worldPos = this.editor.getWorldPosition(event);
    this.lastMouseWorld.copy(worldPos);
    this.handleMouseMove();
  }

  private handleMouseMove() {
    const zoom = (this.camera as THREE.OrthographicCamera).zoom;
    const threshold = this.snapDistance / zoom;
    const worldPos = this.lastMouseWorld;

    const snapCandidates = this.editor.getSnapCandidates(worldPos, threshold);
    const gridPoint = this.editor.getHoveredGridPoint();

    let endPosition = worldPos;

    if (snapCandidates.length > 0 && snapCandidates[0] !== this.lastPointId) {
      this.snapTargetId = snapCandidates[0];
      const pos = this.editor.getPointWorldPosition(snapCandidates[0]);
      if (pos) endPosition = pos;
    } else if (gridPoint) {
      endPosition = gridPoint;
    } else {
      this.snapTargetId = null;
      this.editor.clearHover();

      if (this.isShiftPressed && this.lastPointId) {
        const last = this.editor.getPointWorldPosition(this.lastPointId);
        if (last) endPosition = snapAngle(last, worldPos, this.getConnectedPositions());
      }
    }

    if (!this.lastPointId || !this.previewLine) return;
    const start = this.editor.getPointWorldPosition(this.lastPointId);
    if (!start) return;

    let finalEnd = endPosition.clone();

    const dir = endPosition.clone().sub(start);
    const mouseDistance = dir.length();
    if (mouseDistance > 0) dir.normalize();
    let finalDir = dir.clone();

    // update input when NOT typing
    if (this.inputOverlay.manualLength === null ) {
      this.inputOverlay.setLength(mouseDistance * 10);
      this.snapPosition = null;
    }if (this.inputOverlay.manualAngle === null) {
      const angleRad = Math.atan2(dir.y, dir.x);
      const angleDeg = THREE.MathUtils.radToDeg(angleRad);
      this.inputOverlay.setAngle((angleDeg + 360) % 360);
      this.snapPosition = null;
    }

    
    // enforce manual angle
    if (this.inputOverlay.manualAngle) {
      const angleRad = THREE.MathUtils.degToRad(this.inputOverlay.manualAngle);
      finalDir.set(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
    }
    // enforce manual length
    if (this.inputOverlay.manualLength) {
      finalEnd = start.clone().add(finalDir.multiplyScalar(this.inputOverlay.manualLength));
    }else{
      finalEnd = start.clone().add(finalDir.multiplyScalar(mouseDistance));
    }

    this.snapPosition = finalEnd.clone();
    this.previewLine.geometry.setFromPoints([start.clone(), finalEnd.clone()]);
  }

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
    this.inputOverlay.hide();

    if (this.previewLine) {
      this.scene.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      (this.previewLine.material as THREE.Material).dispose();
      this.previewLine = null;
    }
  }

  private getConnectedPositions() {
    if (!this.lastPointId) return [];
    let positions: THREE.Vector3[] = [];
    const connectedPoints = this.editor.getConnectedPoints(this.lastPointId);
    for (const point of connectedPoints) {
      const otherPos = this.editor.getPointWorldPosition(point);
      if (otherPos) positions.push(otherPos);
    }
    return positions;
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
