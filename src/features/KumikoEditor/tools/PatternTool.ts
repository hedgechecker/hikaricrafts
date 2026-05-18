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

    if (
      Math.pow(event.x - this.downPos.x, 2) +
        Math.pow(event.y - this.downPos.y, 2) >
      1
    )
      return;
    let worldPos = this.context.sceneManager.getWorldPosition(event);

    //Snap to Grid
    const pos = this.context.gridRenderer.getHoveredPos();
    if (pos) {
      worldPos.x = pos.x;
      worldPos.y = pos.y;
      worldPos.z = pos.z;
    }

    this.context.executeCommand(
      new AddPatternCommand({
        id: generateId(),
        pos: {x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        rotation: pos? pos.rotation : 0},
        patternType: "Gomagara",
        materialMap: [],
      }),
    );
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
  }

  //Enable Hover for Patterns and Grid
  handleHover(event: PointerEvent) {

    if (this.context.patternRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.gridRenderer.setHovered(null);
      return;
    }
    if (this.context.gridRenderer.handleHover(event)) {
      this.context.patternRenderer.setHovered(null);
      this.context.cursorManager.setCursor("pointer");
      return;
    }
    this.context.cursorManager.setCursor("default");

  }
}
