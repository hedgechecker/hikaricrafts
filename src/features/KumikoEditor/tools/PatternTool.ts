import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { AddPatternCommand } from "../commands/AddPatternCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { DeletePatternCommand } from "../commands/DeletePatternCommand";
import type { PatternPos } from "../models/Pattern";

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class PatternTool implements Tool {
  private context: ToolContext;
  private downPos = new THREE.Vector2();
  private lastPos: PatternPos = { x: -1000, y: 0, z: 0, rotation: 0 };

  constructor(context: ToolContext) {
    this.context = context;
    this.context.store.subscribe(() => {
      this.previewPattern(true);
    });
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
    const worldPos = this.context.sceneManager.getWorldPosition(event);
    const state = this.context.store.getState();
    const insideFrame =
      worldPos.x < state.settings!.width / 2 &&
      worldPos.x > -state.settings!.width / 2 &&
      worldPos.y < state.settings!.height / 2 &&
      worldPos.y > -state.settings!.height / 2;
    if (!insideFrame) return;

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
        rotation: ((pos.rotation + state.userRotation * 2) % 6) as
          | 0
          | 1
          | 2
          | 3
          | 4
          | 5,
      },
      patternType: state.selectedPattern,
      materialMap: state.materialMap,
    };
    cmds.push(new AddPatternCommand(pattern));

    this.context.executeCommand(new CompositeCommand(cmds));
    this.context.patternRenderer.updateFromData(pattern);
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    this.handleHover(event);
    this.context.gridRenderer.handleHover(event);

    const worldPos = this.context.sceneManager.getWorldPosition(event);
    const state = this.context.store.getState();
    const insideFrame =
      worldPos.x < state.settings!.width / 2 &&
      worldPos.x > -state.settings!.width / 2 &&
      worldPos.y < state.settings!.height / 2 &&
      worldPos.y > -state.settings!.height / 2;
    if (!insideFrame) {
      this.context.patternRenderer.clearPreview();
      return;
    }
    this.previewPattern();
    
  }

  previewPattern(forced?: boolean){
    const state = this.context.store.getState();
    const pos = this.context.gridRenderer.getHoveredPos();
    if (!pos) {
      return;
    }
    if (pos == this.lastPos && !forced ) return;
    const id = "PreviewX" + pos.x + "Y" + pos.y + "Z" + pos.z;
    const pattern = {
      id: id,
      pos: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: ((pos.rotation + state.userRotation * 2) % 6) as
          | 0
          | 1
          | 2
          | 3
          | 4
          | 5,
      },
      patternType: state.selectedPattern,
      materialMap: state.materialMap,
    };
    this.context.patternRenderer.clearPreview();
    this.context.patternRenderer.addFromData(pattern, true);
    this.lastPos = pos;
    this.context.sceneManager.render();
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

  dispose(): void {
    this.context.patternRenderer.clearPreview();
  }
}
