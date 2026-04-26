import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdatePointCommand } from "../commands/UpdatePointCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { computeBoundingRect } from "../utils/math";
import { InputOverlay } from "./InputOverlay";

export class ResizeTool implements Tool {
  private context: ToolContext;
  private inputOverlay: InputOverlay;

  private isDragging = false;

  private center = new THREE.Vector3(0, 0, 0);
  private startDistance = 1;
  private currentScaleX = 1;
  private currentScaleY = 1;

  private rect = { top: 0, left: 0, right: 0, bottom: 0 };
  private lastApplyScaleTime = 0;

  constructor(context: ToolContext) {
    this.context = context;

    this.inputOverlay = new InputOverlay(
      this.context.sceneManager.dom.parentElement!,
      "mm",
      "mm",
      () => this.handleInput(),
      () => {
        (this.applyGlobal(), this.inputOverlay.hide());
      },
    );
  }

  onClick() {
    this.currentScaleX = 1;
    this.currentScaleY = 1;
    this.computeBoundingRect();
    this.context.gizmoRenderer.addFromData({
      id: "0",
      type: "resize",
      pos: new THREE.Vector3(0, 0, 0),
    });
    this.updateHandlePosition();
    this.context.gizmoRenderer.setVisible(true);
    this.isDragging = false;
  }

  onPointerDown(event: PointerEvent): void {
    this.handleHover(event);
    if (!event.isPrimary || event.button !== 0) return;

    const hovered = this.context.gizmoRenderer.getHovered();
    if (hovered) {
      this.isDragging = true;
      this.context.sceneManager.setPanEnabled(false);
      if (event.pointerType != "touch") {
        this.inputOverlay.reset();
        this.inputOverlay.show(event.clientX, event.clientY);
      }

      this.computeBoundingRect();

      const worldPos = this.context.sceneManager.getWorldPosition(event);

      this.startDistance = worldPos.distanceTo(this.center);
      this.updateHandlePosition();
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || !this.isDragging) return;
    this.isDragging = false;
    this.context.sceneManager.setPanEnabled(true);

    this.applyGlobal();
    if (event.pointerType != "touch") {
      this.inputOverlay.focus();
    }
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);

    //if (!this.isDragging) this.inputOverlay.hide();

    if (!event.isPrimary) return;
    if (this.isDragging) {
      const worldPos = this.context.sceneManager.getWorldPosition(event);
      const currentDistance = worldPos.distanceTo(this.center);

      if (this.startDistance === 0) return;

      let scale = currentDistance / this.startDistance;
      scale = THREE.MathUtils.clamp(scale, 0.2, 5);

      this.currentScaleX = scale;
      this.currentScaleY = scale;

      if (Date.now() - this.lastApplyScaleTime > 10) {
        this.applyScale(this.currentScaleX, this.currentScaleY);
        this.lastApplyScaleTime = Date.now();
      }

      this.updateHandlePosition();
    }
  }

  handleInput() {
    if (this.inputOverlay.InputVal1) {
      this.currentScaleX =
        this.inputOverlay.InputVal1 / 10 / (this.rect.right - this.rect.left);
    }
    if (this.inputOverlay.InputVal2) {
      this.currentScaleY =
        this.inputOverlay.InputVal2 / 10 / (this.rect.top - this.rect.bottom);
    }
    this.applyScale(this.currentScaleX, this.currentScaleY);
  }

  private updateHandlePosition() {
    const pos = new THREE.Vector3(this.rect.right + 1, this.rect.top + 1, 0);
    const dir = new THREE.Vector3().subVectors(pos, this.center);
    dir.multiplyScalar(this.currentScaleX);

    pos.copy(this.center).add(dir);

    this.context.gizmoRenderer.updateGizmo("0", pos);
    if (this.inputOverlay.InputVal1 === null) {
      this.inputOverlay.setValue1(
        (this.rect.right - this.rect.left) * this.currentScaleX * 10,
      );
    }
    if (this.inputOverlay.InputVal2 === null) {
      this.inputOverlay.setValue2(
        (this.rect.top - this.rect.bottom) * this.currentScaleY * 10,
      );
    }
  }

  private computeBoundingRect() {
    this.rect = computeBoundingRect([...this.context.model.points.values()]);
    this.center.x = (this.rect.right - this.rect.left) / 2 + this.rect.left;
    this.center.y = (this.rect.top - this.rect.bottom) / 2 + this.rect.bottom;
  }

  private applyScale(scaleX: number, scaleY: number) {
    const points = this.context.model.points;

    for (const p of points) {
      const pos = new THREE.Vector3(p[1].x, p[1].y, p[1].z);
      if (!pos) continue;
      const dir = new THREE.Vector3().subVectors(pos, this.center);
      dir.x *= scaleX;
      dir.y *= scaleY;

      pos.copy(this.center).add(dir);
      this.context.pointRenderer.setPosition(p[0], pos);
    }
    this.context.lineRenderer.updateGeometry();
    this.context.sceneManager.render();
  }

  private applyGlobal() {
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
    this.context.lineRenderer.updateGeometry();
    this.context.sceneManager.render();
    this.currentScaleX = 1;
    this.currentScaleY = 1;
    this.computeBoundingRect();
    this.updateHandlePosition();
  }

  dispose(): void {
    this.context.gizmoRenderer.remove("0");
    this.context.gizmoRenderer.setVisible(false);
    this.inputOverlay.hide();
    this.applyScale(1, 1);
  }

  private handleHover(event: PointerEvent) {
    this.context.gizmoRenderer.handleHover(event);
  }
}
