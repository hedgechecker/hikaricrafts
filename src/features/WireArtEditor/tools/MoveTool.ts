import * as THREE from 'three';
import type { Tool, ToolContext } from './Tool';
import { UpdatePointCommand } from '../commands/UpdatePointCommand';
import { MergePointsCommand } from '../commands/MergePointsCommand';
import { splitLine } from '../utils/commands';
import { CompositeCommand } from '../commands/CompositeCommand';

/**
 * Manages the Movement of Points
 * Merges Points and Lines if necessary
 */
export class MoveTool implements Tool {
  private selectedPoint: string | null = null;
  private startPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();

  private context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  //check for Hit with existing Point
  onMouseDown(event: MouseEvent) {
    if (event.button != 0) return; //only move on left click
    const hovered = this.context.pointRenderer.getHovered();
    if (!hovered) return;
    const pos = this.context.pointRenderer.getWorldPosition(hovered);
    if (!pos) return;
    this.selectedPoint = hovered;
    this.startPosition.copy(pos);

    this.context.pointRenderer.setSelected([this.selectedPoint]);
    this.context.sceneManager.cameraController.setPanEnabled(false);
    this.context.cursorManager.setCursor('grabbing');
  }

  onMouseMove(event: MouseEvent) {
    this.handleHover(event);
    if (!this.selectedPoint) return;
    this.currentPosition = this.context.sceneManager.getWorldPosition(event);
    if (!this.currentPosition) return;

    //Preview Move the Point
    this.context.pointRenderer.setPosition(this.selectedPoint, this.currentPosition);
    this.context.lineRenderer.update();
  }

  onMouseUp() {
    if (!this.selectedPoint) {
      this.context.sceneManager.cameraController.setPanEnabled(true);
      this.selectedPoint = null;
      this.context.pointRenderer.setSelected([]);
      this.context.cursorManager.setCursor('default');
      return;
    }

    if (this.currentPosition.equals(this.startPosition)) return;

    const hoveredPoint = this.context.pointRenderer.getHovered();
    const hoveredLine = this.context.lineRenderer.getHovered();

    //when Hovering a Point: merge
    if (hoveredPoint && hoveredPoint != this.selectedPoint) {
      this.context.executeCommand(new MergePointsCommand(this.selectedPoint, hoveredPoint));
    } //when hovering a Line: Split Line
    else if (hoveredLine) {
      const split = splitLine(this.currentPosition, hoveredLine, this.context.pointRenderer);
      if (split)
        this.context.executeCommand(
          new CompositeCommand([
            split?.command,
            new MergePointsCommand(this.selectedPoint, split?.pointId),
          ]),
        );
    } // Else Move the Point
    else {
      const point = this.context.sceneManager.getHoveredGrid();
      if (point) {
        this.currentPosition.copy(point);
      }
      this.context.executeCommand(
        new UpdatePointCommand({
          id: this.selectedPoint,
          x: this.currentPosition.x,
          y: this.currentPosition.y,
          z: this.currentPosition.z,
        }),
      );
    }

    this.context.sceneManager.cameraController.setPanEnabled(true);
    this.selectedPoint = null;
    this.context.pointRenderer.setSelected([]);
    this.context.cursorManager.setCursor('default');
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: MouseEvent) {
    this.context.pointRenderer.setHovered(null);
    this.context.lineRenderer.setHovered(null);
    this.context.sceneManager.setHoveredGrid(null);
    this.context.cursorManager.setCursor(this.selectedPoint ? 'grabbing' : 'default');

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.selectedPoint && this.context.lineRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.context.sceneManager.handleHover(event)) {
      this.context.cursorManager.setCursor('crosshair');
      return;
    }
  }
}
