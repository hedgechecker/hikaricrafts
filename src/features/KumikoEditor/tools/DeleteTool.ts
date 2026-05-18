import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { DeletePatternCommand } from "../commands/DeletePatternCommand";


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
    //this.dragging = true;
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
      this.handleHover(event);
    const hoveredPattern = this.context.patternRenderer.getHovered();

    if (hoveredPattern) {
      this.context.patternRenderer.remove(hoveredPattern);
      this.context.executeCommand(new DeletePatternCommand(hoveredPattern));
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
    if (!this.dragging) return;
    const hoveredPattern = this.context.patternRenderer.getHovered();
    
    if (hoveredPattern) {
      this.context.patternRenderer.remove(hoveredPattern);
      this.context.executeCommand(new DeletePatternCommand(hoveredPattern));
    }
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {

    if (this.context.patternRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      return;
    }
    this.context.cursorManager.setCursor("default");

  }
  
}
