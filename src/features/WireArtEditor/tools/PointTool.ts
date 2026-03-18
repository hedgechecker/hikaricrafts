import * as THREE from 'three';
import type { Tool, ToolContext } from './Tool';
import { AddPointCommand } from '../commands/AddPointCommand';
import { generateId } from '../utils/id';
import { splitLine } from '../utils/commands';

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class PointTool implements Tool {
  private context: ToolContext;
  private downPos = new THREE.Vector2;

  constructor(context: ToolContext) {
    this.context = context;
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) return;
    this.downPos.x = event.x;
    this.downPos.y = event.y;
    this.handleHover(event);
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary) return;
    //No Placement on existing Points
    if (event.button !== 0) return;
    if (this.context.pointRenderer.getHovered()) return;
    if (Math.pow(event.x - this.downPos.x, 2) + Math.pow(event.y - this.downPos.y, 2) > 0.5) return;
      let worldPos = this.context.sceneManager.getWorldPosition(event);

    //If a Point is placed on a Line split the line at this point
    const hoveredLine = this.context.lineRenderer.getHovered();
    if (hoveredLine) {
      const data = this.context.model.lines.get(hoveredLine);
      if (data) {
        const cmd = splitLine(worldPos, data, this.context.pointRenderer);
        if (cmd) {
          this.context.executeCommand(cmd.command);
        }
        this.context.pointRenderer.handleHover(event);
        return;
      }
    }

    //Snap to Grid
    const point = this.context.gridRenderer.getHoveredGrid();
    if (point) {
      worldPos = point;
    }

    this.context.executeCommand(
      new AddPointCommand({
        id: generateId(),
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
      }),
    );
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
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
