import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdatePatternCommand } from "../commands/UpdatePatternCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { DeletePatternCommand } from "../commands/DeletePatternCommand";

/**
 * Manages the Movement of Points
 * Merges Points and Lines if necessary
 */
export class MoveTool implements Tool {
  private selectedPatterns: string[] = [];
  private startPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();

  private isCrtlPressed: boolean = false;
  private context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key == "Control") this.isCrtlPressed = true;
  }
  onKeyUp(event: KeyboardEvent): void {
    if (event.key == "Control") this.isCrtlPressed = false;
  }
  //check for Hit with existing Point
  onPointerDown(event: PointerEvent) {
    this.handleHover(event);
    //if (event.button != 0) return; //only move on left click
    const hovered = this.context.patternRenderer.getHovered();
    if (!hovered) return;
    const pos = this.context.patternRenderer.getWorldPosition(hovered);
    if (!pos) return;
    if (this.isCrtlPressed) {
      this.selectedPatterns.push(hovered);
    } else {
      this.selectedPatterns = [hovered];
    }
    this.startPosition.copy(pos);
    this.currentPosition.copy(pos);

    this.context.patternRenderer.setSelected(this.selectedPatterns);
    this.context.sceneManager.setPanEnabled(false);
    this.context.cursorManager.setCursor("grabbing");
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);
    if (this.selectedPatterns.length < 1) return;

    const rawPosition = this.context.sceneManager.getWorldPosition(event);
    if (!rawPosition) return;
    this.currentPosition = rawPosition;

    //const delta = this.currentPosition.sub(this.startPosition);
    for (const id of this.selectedPatterns) {
      const origin = this.context.model.patterns.get(id);
      if (!origin) continue;
      // this.context.patternRenderer.updateFromData(
      //   id,
      //   new THREE.Vector3(
      //     origin.pos.x + delta.x,
      //     origin.pos.y + delta.y,
      //     origin.pos.z + delta.z,
      //   ),
      // );
    }
  }

  onPointerUp() {
    if (
      this.selectedPatterns.length < 1 ||
      this.currentPosition.equals(this.startPosition)
    ) {
      this.context.cursorManager.setCursor("default");
      return;
    }

    const hoveredPattern = this.context.patternRenderer.getHovered();

    //when Hovering a Pattern: merge
    if (
      this.selectedPatterns.length == 1 &&
      hoveredPattern &&
      hoveredPattern != this.selectedPatterns[0]
    ) {
      const pat = this.context.model.patterns.get(this.selectedPatterns[0]);
      if(!pat)return;
      this.context.executeCommand(
        new CompositeCommand( [
          new DeletePatternCommand(hoveredPattern),
          new UpdatePatternCommand( pat)
        ]));
      this.selectedPatterns = [];
      this.context.patternRenderer.setSelected([]);
    } // Else Move the Point
    else {
      // const pattern = this.context.gridRenderer.getHovered();
      // if (pattern) {
      //   this.currentPosition.copy(pattern);
      // }
      let commands = [];
      for (const id of this.selectedPatterns) {
        const pos = this.context.patternRenderer.getWorldPosition(id);
        if (pos)
          commands.push(
            new UpdatePatternCommand({
              id: id,
              pos: {x: pos.x,
              y: pos.y,
              z: pos.z,
              rotation: 0,
              },
              patternType: "AsaNoHa",
              materialMap: []
            }),
          );
      }
      this.context.executeCommand(new CompositeCommand(commands));

      this.selectedPatterns = [];
      this.context.patternRenderer.setSelected([]);
    }

    this.context.cursorManager.setCursor("default");
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor(
      this.selectedPatterns.length > 0 ? "grabbing" : "default",
    );

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

  dispose(): void {}
}
