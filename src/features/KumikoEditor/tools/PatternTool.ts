import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { AddPatternCommand } from "../commands/AddPatternCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { DeletePatternCommand } from "../commands/DeletePatternCommand";

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

    //Snap to Grid
    this.context.gridRenderer.handleHover(event);
    const pos = this.context.gridRenderer.getHoveredPos();
    if (!pos) {
      return;
    }

    const cmds = [];
    const id = "X" + pos.x + "Y" + pos.y + "Z" + pos.z;

    if (this.context.model.patterns.has(id)) {
      cmds.push(new DeletePatternCommand(id));
    }

    const pattern = {
      id: id,
      pos: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: pos ? pos.rotation : 0,
      },
      patternType: this.context.store.getState().selectedPattern,
      materialMap: [],
    };
    cmds.push(new AddPatternCommand(pattern));

    this.context.executeCommand(new CompositeCommand(cmds));
    this.context.patternRenderer.updateFromData(pattern);
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
      this.context.cursorManager.setCursor("crosshair");
      return;
    }
    this.context.cursorManager.setCursor("default");
  }
}
