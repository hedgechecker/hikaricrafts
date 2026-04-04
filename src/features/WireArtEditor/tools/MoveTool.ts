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
  private selectedPoint: string | null = null;
  private startPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();

  private context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  //check for Hit with existing Point
  onPointerDown(event: PointerEvent) {
    this.handleHover(event);
    //if (event.button != 0) return; //only move on left click
    const hovered = this.context.pointRenderer.getHovered();
    if (!hovered) return;
    const pos = this.context.pointRenderer.getWorldPosition(hovered);
    if (!pos) return;
    this.selectedPoint = hovered;
    this.startPosition.copy(pos);
    this.currentPosition.copy(pos);

    this.context.pointRenderer.setSelected([this.selectedPoint]);
    this.context.sceneManager.setPanEnabled(false);
    this.context.cursorManager.setCursor("grabbing");
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);
    if (!this.selectedPoint) return;

    const rawPosition = this.context.sceneManager.getWorldPosition(event);
    if (!rawPosition) return;

    const connectedPoints = this.context.lineRenderer.getConnectedPoints(
      this.selectedPoint,
    );
    const origin = this.context.pointRenderer.getWorldPosition(
      this.selectedPoint,
    );
    if(!origin)return;

    let snappedPosition = rawPosition.clone();

    const constraints: { origin: THREE.Vector3; dir: THREE.Vector3 }[] = [];
    // const planeConstraints: { p1: THREE.Vector3; p2: THREE.Vector3 }[] =
    //   [];

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
        // if (Math.abs(dot) < 0.03) {
        //   planeConstraints.push({
        //     p1: p1,
        //     p2: p2,
        //   });
        // }
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

      // for (const c of planeConstraints) {
      //   const A = c.p1;
      //   const B = c.p2;

      //   const SA = snappedPosition.clone().sub(A);
      //   const SB = snappedPosition.clone().sub(B);

      //   const dot = SA.dot(SB);

      //   if (Math.abs(dot) > 1e-6) {
      //     const grad = SA.clone().add(SB);
      //     const denom = grad.lengthSq();

      //     if (denom > 1e-6) {
      //       const lambda = dot / denom;
      //       snappedPosition = snappedPosition
      //         .clone()
      //         .sub(grad.multiplyScalar(lambda));
      //     }
      //   }
      // }
    }

    if (rawPosition.distanceTo(snappedPosition) < 0.2) {
      this.currentPosition = snappedPosition;
    } else {
      this.currentPosition = rawPosition;
    }

    this.context.pointRenderer.setPosition(
      this.selectedPoint,
      this.currentPosition,
    );
    this.context.lineRenderer.update();
  }

  onPointerUp() {
    if (
      !this.selectedPoint ||
      this.currentPosition.equals(this.startPosition)
    ) {
      this.selectedPoint = null;
      this.context.pointRenderer.setSelected([]);
      this.context.cursorManager.setCursor("default");
      return;
    }

    const hoveredPoint = this.context.pointRenderer.getHovered();
    const hoveredLine = this.context.lineRenderer.getHovered();

    //when Hovering a Point: merge
    if (hoveredPoint && hoveredPoint != this.selectedPoint) {
      this.context.executeCommand(
        new MergePointsCommand(this.selectedPoint, hoveredPoint),
      );
    } //when hovering a Line: Split Line
    else if (hoveredLine) {
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
              new MergePointsCommand(this.selectedPoint, split?.pointId),
            ]),
          );
      }
    } // Else Move the Point
    else {
      const point = this.context.gridRenderer.getHoveredGrid();
      if (point) {
        this.currentPosition.copy(point);
      }
      this.context.executeCommand(
        new UpdatePointCommand({
          id: this.selectedPoint,
          x: this.currentPosition.x,
          y: this.currentPosition.y,
          z: this.currentPosition.z,
        }),
      );
    }

    this.selectedPoint = null;
    this.context.pointRenderer.setSelected([]);
    this.context.cursorManager.setCursor("default");
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor(
      this.selectedPoint ? "grabbing" : "default",
    );

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.lineRenderer.setHovered(null);
      this.context.gridRenderer.setHovered(null);
      return;
    }
    if (this.selectedPoint && this.context.lineRenderer.handleHover(event)) {
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

  dispose(): void {
    
  }
}
