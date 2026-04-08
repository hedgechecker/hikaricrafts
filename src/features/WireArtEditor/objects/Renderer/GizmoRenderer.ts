import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";

interface GizmoRenderData extends RenderData{
  type: string;
}

interface GizmoData {
  id: string;
  type: string;
  pos: THREE.Vector3;
}

export class GizmoRenderer extends BaseRenderer<GizmoRenderData, GizmoData> {
  private color = "#999999";
  private readonly hoverThickness = 2.0;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);
    this.visible = false;
  }

  protected getId(data: GizmoData) {
    return data.id;
  }
  public addFromData(data: GizmoData) {
    const group = new THREE.Group();
    const baseRadius = 0.1;
    const hitRadius = 0.25;

    const geometry = new THREE.CircleGeometry(baseRadius, 32);

    const material = new THREE.MeshBasicMaterial({
      color: this.color,
    });

    const circle = new THREE.Mesh(geometry, material);

    // Outline
    const edges = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
    });

    const outline = new THREE.LineSegments(edges, outlineMaterial);

    circle.name = "visual";
    outline.name = "outline";

    const hitGeometry = new THREE.CircleGeometry(hitRadius, 32);

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
    hitbox.name = "hitbox";
    const size = 1.0 / this.zoom;
    circle.scale.set(size, size, 1);
    outline.scale.set(size, size, 1);
    hitbox.scale.set(size, size, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);

    group.userData.type = data.type;
    // group.userData.corner = i;
    // this.handles.push(group);

    group.userData.id = data.id;
    group.position.copy(data.pos);
    group.visible = this.visible;
    this.sceneManager.scene.add(group);

    this.objects.set(data.id, {
      mesh: group,
      isSelected: false,
      isHovered: false,
      isInValid: false,
      type: data.type,
    });
  }

  protected updateFromData(data: GizmoData) {
    this.updateGizmo(data);
  }

  updateGizmo(data: GizmoData) {
    const p = this.objects.get(data.id);
    if (!p) return;
    p.mesh.position.copy(data.pos);
  }

  getFirstHoverableGizmo(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
      if (!id) continue;
      return id;
    }
    return null;
  }
  getType(id: string) {
    const object = this.objects.get(id);
    if (!object) return "any";
    return object.type;
  }

  update(zoom: number) {
    this.zoom = zoom;
    const size = 1.0 / zoom;
    this.objects.forEach((object) => {
      const isHovered = object.isHovered;

      object.mesh.children.forEach((child) => {
        if (isHovered && child.name != "hitbox") {
          child.scale.set(
            size * this.hoverThickness,
            size * this.hoverThickness,
            1,
          );
          child.visible = true;
        } else {
          child.scale.set(size, size, 1);
        }
      });
    });
  }

  handleHover(event: MouseEvent): boolean {
    const rect = this.sceneManager.dom.getBoundingClientRect();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const intersects = this.raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredId = this.getFirstHoverableGizmo(intersects);
    this.setHovered(hoveredId);
    if (hoveredId) {
      return true;
    }
    return false;
  }
}
