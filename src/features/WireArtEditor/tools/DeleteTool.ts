import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { DeletePointCommand } from "../commands/DeletePointCommand";
import { DeleteLineCommand } from "../commands/DeleteLineCommand";

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class DeleteTool implements Tool {
  private context: ToolContext;
  private downPos = new THREE.Vector2();
  private dragging = false;

  constructor(context: ToolContext) {
    this.context = context;
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) return;
    if (event.button !== 0) return;
    this.downPos.x = event.x;
    this.downPos.y = event.y;
    this.handleHover(event);
    this.dragging = true;
  }

  onPointerUp(event: PointerEvent): void {
    this.dragging = false;
    if (!event.isPrimary) return;
    if (event.button !== 0) return;
    if (
      Math.pow(event.x - this.downPos.x, 2) +
        Math.pow(event.y - this.downPos.y, 2) >
      0.5
    )
      return;
    const hoveredPoint = this.context.pointRenderer.getHovered();
    const hoveredLine = this.context.lineRenderer.getHovered();

    if (hoveredPoint) {
      this.context.executeCommand(new DeletePointCommand(hoveredPoint));
      this.context.pointRenderer.remove(hoveredPoint);
    }

    if (hoveredLine) {
      this.context.executeCommand(new DeleteLineCommand(hoveredLine));
      this.context.lineRenderer.remove(hoveredLine);
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
    if (!this.dragging) return;
    const hoveredPoint = this.context.pointRenderer.getHovered();
    const hoveredLine = this.context.lineRenderer.getHovered();
    
    if (hoveredPoint) {
      this.context.executeCommand(new DeletePointCommand(hoveredPoint));
      this.context.pointRenderer.remove(hoveredPoint);
    }

    if (hoveredLine) {
      this.context.executeCommand(new DeleteLineCommand(hoveredLine));
      this.context.lineRenderer.remove(hoveredLine);
    }
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor("default");

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.lineRenderer.setHovered(null);

      return;
    }
    if (this.context.lineRenderer.handleHover(event)) {
      this.context.pointRenderer.setHovered(null);
      this.context.cursorManager.setCursor("pointer");
      return;
    }
  }
}
