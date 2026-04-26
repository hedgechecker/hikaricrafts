import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdatePointCommand } from "../commands/UpdatePointCommand";
import { MergePointsCommand } from "../commands/MergePointsCommand";
import { splitLine } from "../utils/commands";
import { CompositeCommand } from "../commands/CompositeCommand";

/**
 * Manages the Movement of Points
 * Merges Points and Lines if necessary
 */
export class MoveTool implements Tool {
  private selectedPoints: string[] = [];
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
    const hovered = this.context.pointRenderer.getHovered();
    if (!hovered) return;
    const pos = this.context.pointRenderer.getWorldPosition(hovered);
    if (!pos) return;
    if (this.isCrtlPressed) {
      this.selectedPoints.push(hovered);
    } else {
      this.selectedPoints = [hovered];
    }
    this.startPosition.copy(pos);
    this.currentPosition.copy(pos);

    this.context.pointRenderer.setSelected(this.selectedPoints);
    this.context.sceneManager.setPanEnabled(false);
    this.context.cursorManager.setCursor("grabbing");
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);
    if (this.selectedPoints.length < 1) return;

    const rawPosition = this.context.sceneManager.getWorldPosition(event);
    if (!rawPosition) return;
    this.currentPosition = rawPosition;

    if (this.selectedPoints.length == 1) {
      const connectedPoints = this.context.lineRenderer.getConnectedPoints(
        this.selectedPoints[0],
      );
      const origin = this.context.pointRenderer.getWorldPosition(
        this.selectedPoints[0],
      );
      if (!origin) return;

      let snappedPosition = rawPosition.clone();

      const constraints: { origin: THREE.Vector3; dir: THREE.Vector3 }[] = [];

      for (let i = 0; i < connectedPoints.length; i++) {
        for (let j = i + 1; j < connectedPoints.length; j++) {
          const p1 = this.context.pointRenderer.getWorldPosition(
            connectedPoints[i],
          );
          const p2 = this.context.pointRenderer.getWorldPosition(
            connectedPoints[j],
          );
          if (!p2 || !p1) continue;

          const d1 = p1.clone().sub(origin).normalize();
          const d2 = p2.clone().sub(origin).normalize();

          const dot = d1.dot(d2);

          if (dot < -0.97) {
            const dir = p2.clone().sub(p1).normalize();
            constraints.push({ origin: p1, dir });
          }
        }
      }

      const ITERATIONS = 3;

      for (let k = 0; k < ITERATIONS; k++) {
        for (const c of constraints) {
          const v = snappedPosition.clone().sub(c.origin);
          const projectedLength = v.dot(c.dir);
          snappedPosition = c.origin
            .clone()
            .add(c.dir.clone().multiplyScalar(projectedLength));
        }
      }

      if (
        rawPosition.distanceTo(snappedPosition) <
        0.3 / this.context.sceneManager.camera.zoom
      ) {
        this.currentPosition = snappedPosition;
      }
    }

    const delta = this.currentPosition.sub(this.startPosition);
    for (const id of this.selectedPoints) {
      const origin = this.context.model.points.get(id);
      if (!origin) continue;
      this.context.pointRenderer.setPosition(
        id,
        new THREE.Vector3(
          origin.x + delta.x,
          origin.y + delta.y,
          origin.z + delta.z,
        ),
      );
    }

    this.context.lineRenderer.updateGeometry();
  }

  onPointerUp() {
    if (
      this.selectedPoints.length < 1 ||
      this.currentPosition.equals(this.startPosition)
    ) {
      this.context.cursorManager.setCursor("default");
      return;
    }

    const hoveredPoint = this.context.pointRenderer.getHovered();
    const hoveredLine = this.context.lineRenderer.getHovered();

    //when Hovering a Point: merge
    if (
      this.selectedPoints.length == 1 &&
      hoveredPoint &&
      hoveredPoint != this.selectedPoints[0]
    ) {
      this.context.executeCommand(
        new MergePointsCommand(this.selectedPoints[0], hoveredPoint),
      );
      this.selectedPoints = [];
      this.context.pointRenderer.setSelected([]);
    } //when hovering a Line: Split Line
    else if (this.selectedPoints.length == 1 && hoveredLine) {
      const data = this.context.model.lines.get(hoveredLine);
      if (data) {
        const split = splitLine(
          this.currentPosition,
          data,
          this.context.pointRenderer,
        );
        if (split)
          this.context.executeCommand(
            new CompositeCommand([
              split?.command,
              new MergePointsCommand(this.selectedPoints[0], split?.pointId),
            ]),
          );
        this.selectedPoints = [];
        this.context.pointRenderer.setSelected([]);
      }
    } // Else Move the Point
    else {
      const point = this.context.gridRenderer.getHoveredPoint();
      if (point) {
        this.currentPosition.copy(point);
      }
      let commands = [];
      for (const id of this.selectedPoints) {
        const pos = this.context.pointRenderer.getWorldPosition(id);
        if (pos)
          commands.push(
            new UpdatePointCommand({
              id: id,
              x: pos.x,
              y: pos.y,
              z: pos.z,
            }),
          );
      }
      this.context.executeCommand(new CompositeCommand(commands));

      this.selectedPoints = [];
      this.context.pointRenderer.setSelected([]);
    }

    this.context.cursorManager.setCursor("default");
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor(
      this.selectedPoints.length > 0 ? "grabbing" : "default",
    );

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.lineRenderer.setHovered(null);
      this.context.gridRenderer.setHovered(null);
      return;
    }
    if (
      this.selectedPoints.length == 1 &&
      this.context.lineRenderer.handleHover(event)
    ) {
      this.context.pointRenderer.setHovered(null);
      this.context.cursorManager.setCursor("pointer");
      this.context.gridRenderer.setHovered(null);

      return;
    }
    if (this.context.gridRenderer.handleHover(event)) {
      this.context.pointRenderer.setHovered(null);
      this.context.lineRenderer.setHovered(null);
      this.context.cursorManager.setCursor("crosshair");
      return;
    }
  }

  dispose(): void {}
}
