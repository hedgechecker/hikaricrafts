import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { AddPointCommand } from "../commands/AddPointCommand";
import { generateId } from "../utils/id";
import { splitLine } from "../utils/commands";
import { findLineIntersections } from "../utils/graphs";
import { DeleteLineCommand } from "../commands/DeleteLineCommand";
import { AddLineCommand } from "../commands/AddLineCommand";
import { CompositeCommand } from "../commands/CompositeCommand";

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class PointTool implements Tool {
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
    if (this.context.pointRenderer.getHovered()) return;
    if (
      Math.pow(event.x - this.downPos.x, 2) +
        Math.pow(event.y - this.downPos.y, 2) >
      1
    )
      return;
    let worldPos = this.context.sceneManager.getWorldPosition(event);

    //Split Line up at intersection
    const intersection = this.getClosestIntersection(
      new THREE.Vector2(worldPos.x, worldPos.y),
    );
    if (intersection) {
      console.log("intersection");
      const l1 = this.context.model.lines.get(intersection.line1Id);
      const l2 = this.context.model.lines.get(intersection.line2Id);
      if (!l1 || !l2) return;

      const cmds = [];
      cmds.push(new DeleteLineCommand(l1.id));
      cmds.push(new DeleteLineCommand(l2.id));
      const pointId = generateId();
      cmds.push(
        new AddPointCommand({
          id: pointId,
          x: intersection.point.x,
          y: intersection.point.y,
          z: 0,
        }),
      );
      cmds.push(
        new AddLineCommand({
          id: l1.id,
          startPointId: l1.startPointId,
          endPointId: pointId,
        }),
      );
      cmds.push(
        new AddLineCommand({
          id: generateId(),
          startPointId: pointId,
          endPointId: l1.endPointId,
        }),
      );
      cmds.push(
        new AddLineCommand({
          id: l2.id,
          startPointId: l2.startPointId,
          endPointId: pointId,
        }),
      );
      cmds.push(
        new AddLineCommand({
          id: generateId(),
          startPointId: pointId,
          endPointId: l2.endPointId,
        }),
      );

      this.context.executeCommand(new CompositeCommand(cmds));

      this.context.pointRenderer.handleHover(event);
      return;
    }

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

  getClosestIntersection(worldPos: THREE.Vector2, threshold = 0.2) {
    let closest: {
      point: THREE.Vector3;
      line1Id: string;
      line2Id: string;
    } | null = null;
    let minDist = threshold;

    const intersections = findLineIntersections(
      this.context.model.points,
      this.context.model.lines,
    );

    for (let i = 0; i < intersections.length; i++) {
      const inter = intersections.at(i);
      if (!inter) continue;
      let x = inter.point.x;
      let y = inter.point.y;
      const p = new THREE.Vector2(x, y);
      const dist = p.distanceTo(worldPos);
      if (dist < minDist) {
        minDist = dist;
        closest = inter;
      }
    }

    return closest;
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.pointRenderer.setHovered(null);
    this.context.lineRenderer.setHovered(null);
    this.context.gridRenderer.setHovered(null);
    this.context.cursorManager.setCursor("default");

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      return;
    }
    if (this.context.lineRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      return;
    }
    if (this.context.gridRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("crosshair");
      return;
    }
  }
}
