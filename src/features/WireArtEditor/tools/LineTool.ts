import * as THREE from 'three';
import type { Tool, ToolContext } from './Tool';
import { AddPointCommand } from '../commands/AddPointCommand';
import { AddLineCommand } from '../commands/AddLineCommand';
import { generateId } from '../utils/id';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/Addons.js';
import { projectPointToSegment, snapAngle } from '../utils/math';
import { InputOverlay } from './InputOverlay';
import { splitLine } from '../utils/commands';
import type { LineData } from '../models/Line';
import { CompositeCommand } from '../commands/CompositeCommand';
import type { Command } from '../commands/Command';

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class LineTool implements Tool {
  private lastPointId: string | null = null;
  private previewLine: Line2 | null = null;

  private isShiftPressed = false;
  private context: ToolContext;

  private inputOverlay: InputOverlay;
  private worldPos = new THREE.Vector3();

  constructor(context: ToolContext) {
    this.context = context;

    this.inputOverlay = new InputOverlay(this.context.sceneManager.dom.parentElement!, () =>
      this.handleMouseMove(),
    );

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onPointerDown(event: PointerEvent) {
    //right mouse button
    if (event.button === 2) {
      this.cancelLine();
      return;
    }
    //only left mouse click
    if (event.button !== 0) return;

    this.worldPos.copy(this.context.sceneManager.getWorldPosition(event));
    let snapCandidate = this.getBestSnappingCandidate(this.worldPos);

    this.inputOverlay.reset();
    this.inputOverlay.show(event.clientX, event.clientY);
    this.inputOverlay.focus();

    let selectedPointId: string | null = null;
    let commands: Command[] = [];

    //an already existing Point
    if (snapCandidate.pointId) {
      selectedPointId = snapCandidate.pointId;
    }
    //if a Line gets clicked split it
    else if (snapCandidate.line) {
      const cmd = splitLine(this.worldPos, snapCandidate.line, this.context.pointRenderer);
      if (cmd) {
        commands.push(cmd.command);
        selectedPointId = cmd.pointId;
      }
    }
    //when clicking at an empty world Position
    else if (snapCandidate.position) {
      selectedPointId = generateId();
      commands.push(new AddPointCommand({ id: selectedPointId, ...snapCandidate.position }));
    }

    //Line between lastPoint and current Point
    if (
      this.lastPointId &&
      selectedPointId &&
      selectedPointId !== this.lastPointId &&
      !this.context.lineRenderer.hasLineBetween(this.lastPointId, selectedPointId)
    ) {
      commands.push(
        new AddLineCommand({
          id: generateId(),
          startPointId: this.lastPointId,
          endPointId: selectedPointId,
        }),
      );
    }

    //add Point and Line Together
    this.context.executeCommand(new CompositeCommand(commands));

    this.lastPointId = selectedPointId;
    if (!this.previewLine) {
      this.createPreviewLine();
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!this.lastPointId) this.inputOverlay.hide();
    this.worldPos.copy(this.context.sceneManager.getWorldPosition(event));

    this.handleHover(event);
    this.handleMouseMove();
  }

  private handleMouseMove() {
    if (!this.lastPointId || !this.previewLine) return;
    const start = this.context.pointRenderer.getWorldPosition(this.lastPointId);
    if (!start) return;

    let snapCandidate = this.getBestSnappingCandidate(this.worldPos);
    let endPosition = this.worldPos;

    //snap to the Possible Candidates
    if (snapCandidate.pointId) {
      const pos = this.context.pointRenderer.getWorldPosition(snapCandidate.pointId);
      if (pos) endPosition = pos;
    } else if (snapCandidate.line) {
      const a = this.context.pointRenderer.getWorldPosition(snapCandidate.line.startPointId);
      const b = this.context.pointRenderer.getWorldPosition(snapCandidate.line.endPointId);
      if (a && b) endPosition = projectPointToSegment(this.worldPos, a, b);
    } else if (snapCandidate.position) {
      endPosition = snapCandidate.position;
    }

    let dir = endPosition.clone().sub(start);
    const mouseDistance = dir.length();
    if (mouseDistance > 0) dir.normalize();

    // update inputField when no manual Input
    if (this.inputOverlay.manualLength === null) {
      this.inputOverlay.setLength(mouseDistance * 10);
    }
    // update inputField when no manual Input
    if (this.inputOverlay.manualAngle === null) {
      const angleRad = Math.atan2(dir.y, dir.x);
      const angleDeg = THREE.MathUtils.radToDeg(angleRad);
      this.inputOverlay.setAngle((angleDeg + 360) % 360);
    }

    this.previewLine.geometry.setFromPoints([start.clone(), endPosition.clone()]);
  }

  private createPreviewLine() {
    const geometry = new LineGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

    const material = new LineMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });

    material.resolution.set(
      this.context.sceneManager.dom.clientWidth,
      this.context.sceneManager.dom.clientHeight,
    );

    this.previewLine = new Line2(geometry, material);
    this.previewLine.computeLineDistances();
    this.context.sceneManager.scene.add(this.previewLine);
  }

  private cancelLine() {
    this.lastPointId = null;
    this.inputOverlay.hide();

    if (this.previewLine) {
      this.context.sceneManager.scene.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      (this.previewLine.material as THREE.Material).dispose();
      this.previewLine = null;
    }
  }

  /**
   *
   * @returns the Positions of the Points connected to the last selected Point
   */
  private getConnectedPositions() {
    if (!this.lastPointId) return [];
    let positions: THREE.Vector3[] = [];
    const connectedPoints = this.context.lineRenderer.getConnectedPoints(this.lastPointId);
    for (const point of connectedPoints) {
      const otherPos = this.context.pointRenderer.getWorldPosition(point);
      if (otherPos) positions.push(otherPos);
    }
    return positions;
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
    line: LineData | null;
    position: THREE.Vector3 | null;
  } {
    //1 Snap to User Input Values
    const hasUserInputLength =
      (this.inputOverlay.manualAngle || this.inputOverlay.manualLength) && this.lastPointId;
    if (hasUserInputLength) {
      return { pointId: null, line: null, position: this.calculateUserInputLine() };
    }
    //2 Snap to existing Points
    const hoveredPoint = this.context.pointRenderer.getHovered();
    if (hoveredPoint) return { pointId: hoveredPoint, line: null, position: null };
    //3 Snap to existing Lines
    const hoveredLine = this.context.lineRenderer.getHovered();
    if (hoveredLine) {
      const line = this.context.model.lines.get(hoveredLine);
      if(line) return { pointId: null, line: line, position: null };
    }
    //4 Snap to next grid Point
    const snapGridPoint = this.context.gridRenderer.getHoveredGrid();
    if (snapGridPoint) {
      return { pointId: null, line: null, position: snapGridPoint };
    }
    //5 Snap Angle
    if (this.isShiftPressed && this.lastPointId) {
      const last = this.context.pointRenderer.getWorldPosition(this.lastPointId);
      if (last) worldPos = snapAngle(last, worldPos, this.getConnectedPositions());
      return { pointId: null, line: null, position: worldPos };
    }
    //6 return given Position
    return { pointId: null, line: null, position: worldPos };
  }

  /**
   * Calculates the Point wich follows the input of user (length/angle)
   * @returns the snapped Line
   */
  private calculateUserInputLine() {
    let endPosition;
    if (!this.lastPointId) return null;
    const start = this.context.pointRenderer.getWorldPosition(this.lastPointId);
    if (!start) return null;

    let dir = this.worldPos.clone().sub(start);
    const distance = dir.length();
    if (distance > 0) dir.normalize();

    // enforce manual angle
    if (this.inputOverlay.manualAngle) {
      const angleRad = THREE.MathUtils.degToRad(this.inputOverlay.manualAngle);
      dir.set(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
    }
    // enforce manual length
    if (this.inputOverlay.manualLength) {
      endPosition = start.clone().add(dir.multiplyScalar(this.inputOverlay.manualLength));
    } else {
      endPosition = start.clone().add(dir.multiplyScalar(distance));
    }

    return endPosition;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') this.isShiftPressed = true;
    if (event.key === 'Escape') this.cancelLine();
    if (event.key === 'Tab') this.inputOverlay.switchInput(event);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') this.isShiftPressed = false;
  };

  dispose() {
    this.cancelLine();
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.pointRenderer.setHovered(null);
    this.context.lineRenderer.setHovered(null);
    this.context.gridRenderer.setHovered(null);
    this.context.cursorManager.setCursor('default');

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.context.lineRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.context.gridRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('crosshair');
      return;
    }
  }
}
