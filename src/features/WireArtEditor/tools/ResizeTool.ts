import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdatePointCommand } from "../commands/UpdatePointCommand";
import { CompositeCommand } from "../commands/CompositeCommand";

export class ResizeTool implements Tool {
  private context: ToolContext;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private handle: THREE.Mesh;
  private isDragging = false;

  private center = new THREE.Vector3(0, 0, 0);
  private startDistance = 1;
  private currentScale = 1;

  private rect = { top: 0, left: 0, right: 0, bottom: 0 };

  constructor(context: ToolContext) {
    this.context = context;

    // --- Create visible handle ---
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.handle = new THREE.Mesh(geometry, material);

    this.context.sceneManager.scene.add(this.handle);

    this.rect = this.computeBoundingRect();
    this.updateHandlePosition();
  }

  onClick() {
    this.currentScale = 1;
    this.rect = this.computeBoundingRect();
    this.context.sceneManager.scene.add(this.handle);
    this.updateHandlePosition();
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;

    if (this.isHoveringHandle(event)) {
      this.isDragging = true;

      this.rect = this.computeBoundingRect();
      this.computeCenter();

      const worldPos = this.context.sceneManager.getWorldPosition(event);

      this.startDistance = worldPos.distanceTo(this.center);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;
    this.isDragging = false;
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
    } else {
      this.updateHover(event);
    }
  }

  private updateHandlePosition() {
    const halfWidth = (this.rect.right - this.rect.left) / 2;
    const halfHeight = (this.rect.top - this.rect.bottom) / 2;

    this.handle.position.copy(new THREE.Vector3(halfWidth, halfHeight, 0).multiplyScalar(this.currentScale));
  }

  private isHoveringHandle(event: PointerEvent): boolean {
    const rect = this.context.sceneManager.dom.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.context.sceneManager.camera);
    const hits = this.raycaster.intersectObject(this.handle);

    return hits.length > 0;
  }

  private updateHover(event: PointerEvent) {
    if (this.isHoveringHandle(event)) {
      this.context.cursorManager.setCursor("pointer");
      (this.handle.material as THREE.MeshBasicMaterial).color.set(0xffff00);
    } else {
      this.context.cursorManager.setCursor("default");
      (this.handle.material as THREE.MeshBasicMaterial).color.set(0xffaa00);
    }
  }

  private computeCenter() {
    this.center.x = (this.rect.right - this.rect.left) / 2 + this.rect.left;
    this.center.y = (this.rect.top - this.rect.bottom) / 2 + this.rect.bottom;
  }

  private computeBoundingRect() {
    const inf = Number.MAX_SAFE_INTEGER;
    const points = this.context.model.points.values();
    let left = inf,
      right = -inf,
      top = -inf,
      bottom = inf;
    for (const p of points) {
      if (p.x > right) right = p.x;
      if (p.x < left) left = p.x;
      if (p.y > top) top = p.y;
      if (p.y < bottom) bottom = p.y;
    }
    this.computeCenter();
    return { top: top, bottom: bottom, right: right, left: left };
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
    this.context.lineRenderer.update();
  }

  dispose(): void {
    this.context.sceneManager.scene.remove(this.handle);
  }
}
