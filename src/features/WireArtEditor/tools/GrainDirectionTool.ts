import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { findPoygons, getPolygonCentroid, type Vertex } from "../utils/graphs";
import type { GizmoData } from "../objects/Renderer/GizmoRenderer";

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class GrainDirectionTool implements Tool {
  private context: ToolContext;
  private polygons: Vertex[][] = [];
  private selected: string | null = null;
  private gizmos: Map<string, GizmoData> = new Map();

  constructor(context: ToolContext) {
    this.context = context;
  }

  onClick(): void {
    this.polygons = findPoygons(
      this.context.model.points,
      this.context.model.lines,
    );

    this.polygons.forEach((polygon, id) => {
      const pos = getPolygonCentroid(polygon);
      const data = {
        id: id.toString(),
        type: "direction",
        pos: new THREE.Vector3(pos.x, pos.y),
        rotation: 0,
      };
      this.gizmos.set(id.toString(), data);
      this.context.gizmoRenderer.addFromData(data);
    });
    this.context.gizmoRenderer.setVisible(true);
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) return;
    this.handleHover(event);
    this.selected = this.context.gizmoRenderer.getHovered();
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || !this.selected) return;
    console.log(this.polygons.at(Number(this.selected)));
    console.log(this.gizmos.get(this.selected));
    this.selected = null;
  }

  onPointerMove(event: PointerEvent) {
    if (!event.isPrimary || !this.selected) {
      this.handleHover(event);
      return;
    }
    const worldPos = this.context.sceneManager.getWorldPosition(event);
    const gizmoPos = this.context.gizmoRenderer.getWorldPosition(this.selected);
    if (!gizmoPos) return;
    const dx = worldPos.x - gizmoPos.x;
    const dy = worldPos.y - gizmoPos.y;
    const angle = Math.atan2(dy, dx);

    const gizmo = this.gizmos.get(this.selected);
    if (gizmo) gizmo.rotation = angle;

    this.context.gizmoRenderer.updateGizmo(this.selected, undefined, angle);
    this.context.sceneManager.render();
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "e") this.exportPolygons();
  };

  exportPolygons() {
    let ansString = "" + this.polygons.length + "\n";
    this.polygons.forEach((polygon, id) => {
      const rotation = this.gizmos.get(id.toString())?.rotation;
      ansString += id.toString() + " " + rotation + " " + polygon.length + "\n";
      polygon.forEach((vertex) => {
        ansString += vertex.position.x + " " + vertex.position.y + " " + "\n";
      });
    });
    console.log(ansString);
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor("default");

    if (this.context.gizmoRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      return;
    }
  }

  dispose(): void {
    this.polygons.forEach((_polygon, id) => {
      this.context.gizmoRenderer.remove(id.toString());
    });
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
