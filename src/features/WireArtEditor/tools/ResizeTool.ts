import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdatePointCommand } from "../commands/UpdatePointCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { computeBoundingRect } from "../utils/math";

export class ResizeTool implements Tool {
  private context: ToolContext;

  private isDragging = false;

  private center = new THREE.Vector3(0, 0, 0);
  private startDistance = 1;
  private currentScale = 1;

  private rect = { top: 0, left: 0, right: 0, bottom: 0 };

  constructor(context: ToolContext) {
    this.context = context;

    this.computeBoundingRect();
    this.updateHandlePosition();
  }

  onClick() {
    this.currentScale = 1;
    this.computeBoundingRect();
    this.context.gizmoRenderer.setVisible(true);
    this.context.gizmoRenderer.addFromData({
      id: "0",
      type: "resize",
      pos: new THREE.Vector3(0, 0, 0),
    });
    this.updateHandlePosition();
  }

  onPointerDown(event: PointerEvent): void {
    this.handleHover(event);
    if (!event.isPrimary || event.button !== 0) return;

    const hovered = this.context.gizmoRenderer.getHovered();
    if (hovered) {
      this.isDragging = true;
      this.context.sceneManager.setPanEnabled(false);

      this.computeBoundingRect();

      const worldPos = this.context.sceneManager.getWorldPosition(event);

      this.startDistance = worldPos.distanceTo(this.center);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;
    this.isDragging = false;
    this.context.sceneManager.setPanEnabled(true);
    const points = this.context.model.points;
    const commands = [];
    for (const p of points) {
      const pos = this.context.pointRenderer.getWorldPosition(p[0]);
      if (!pos) continue;
      commands.push(
        new UpdatePointCommand({ id: p[0], x: pos.x, y: pos.y, z: pos.z }),
      );
    }
    this.context.executeCommand(new CompositeCommand(commands));
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);
    if (!event.isPrimary) return;
    if (this.isDragging) {
      const worldPos = this.context.sceneManager.getWorldPosition(event);
      const currentDistance = worldPos.distanceTo(this.center);

      if (this.startDistance === 0) return;

      let scale = currentDistance / this.startDistance;
      scale = THREE.MathUtils.clamp(scale, 0.2, 5);

      this.currentScale = scale;

      this.applyScale(scale);
      this.updateHandlePosition();
    }
  }

  private updateHandlePosition() {
    const pos = new THREE.Vector3(this.rect.right, this.rect.top, 0);
    const dir = new THREE.Vector3().subVectors(pos, this.center);
    dir.multiplyScalar(this.currentScale);

    pos.copy(this.center).add(dir);

    this.context.gizmoRenderer.updateGizmo("0", pos);
  }

  private computeBoundingRect() {
    this.rect = computeBoundingRect([...this.context.model.points.values()]);
    this.center.x = (this.rect.right - this.rect.left) / 2 + this.rect.left;
    this.center.y = (this.rect.top - this.rect.bottom) / 2 + this.rect.bottom;
  }

  private applyScale(scale: number) {
    const points = this.context.model.points;

    for (const p of points) {
      const pos = new THREE.Vector3(p[1].x, p[1].y, p[1].z);
      if (!pos) continue;
      const dir = new THREE.Vector3().subVectors(pos, this.center);
      dir.multiplyScalar(scale);

      pos.copy(this.center).add(dir);
      this.context.pointRenderer.setPosition(p[0], pos);
    }
    this.context.lineRenderer.updateGeometry();
  }

  dispose(): void {
    this.context.gizmoRenderer.remove("0");
    this.context.gizmoRenderer.setVisible(false);
  }

  private handleHover(event: PointerEvent) {
    this.context.gizmoRenderer.handleHover(event);
  }
}
