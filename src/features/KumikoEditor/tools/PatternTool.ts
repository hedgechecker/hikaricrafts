import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { AddPatternCommand } from "../commands/AddPatternCommand";
import { generateId } from "../utils/id";

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class PatternTool implements Tool {
  private context: ToolContext;
  private downPos = new THREE.Vector2();

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
    if (event.button !== 0) return;

    //No Placement on existing Points
    if (this.context.patternRenderer.getHovered()) return;
    if (
      Math.pow(event.x - this.downPos.x, 2) +
        Math.pow(event.y - this.downPos.y, 2) >
      1
    )
      return;
    let worldPos = this.context.sceneManager.getWorldPosition(event);

    //Snap to Grid
    const point = this.context.gridRenderer.getHoveredPoint();
    if (point) {
      worldPos = point;
    }

    this.context.executeCommand(
      new AddPatternCommand({
        id: generateId(),
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        rotation: 0,
        patternType: "AsaNoHa",
        materialMap: [],
      }),
    );
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor("default");

    if (this.context.patternRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.gridRenderer.setHovered(null);
      return;
    }
    if (this.context.gridRenderer.handleHover(event)) {
      this.context.patternRenderer.setHovered(null);
      this.context.cursorManager.setCursor("crosshair");
      return;
    }
  }
}
