import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";

interface GizmoRenderData extends RenderData {
  type: string;
}

export interface GizmoData {
  id: string;
  type: string;
  pos: THREE.Vector3;
  rotation?: number;
}

export class GizmoRenderer extends BaseRenderer<GizmoRenderData, GizmoData> {
  private readonly hoverThickness = 2.0;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);
    this.visible = false;
  }

  protected getId(data: GizmoData) {
    return data.id;
  }

  private textureCache = new Map<string, THREE.Texture>();
  
  public addFromData(data: GizmoData) {
    const group = new THREE.Group();
    const baseRadius = 0.1;
    const hitRadius = 0.25;

    let texture = this.textureCache.get(data.type);
    if (!texture) {
      texture = new THREE.TextureLoader().load(`/icons/${data.type}.svg`);
      texture.minFilter = THREE.LinearFilter; // Faster initial render
      this.textureCache.set(data.type, texture);
    }

    const geometry = new THREE.CircleGeometry(baseRadius, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.name = "visual";

    const geometry2 = new THREE.CircleGeometry(baseRadius * 1.5, 32);
    const material2 = new THREE.MeshBasicMaterial({
      transparent: true,
      color: 0xffffff,
    });
    const circle2 = new THREE.Mesh(geometry2, material2);
    circle2.name = "visual";
    circle2.position.z = -0.5;

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
    circle2.scale.set(size, size, 1);
    hitbox.scale.set(size, size, 1);
    group.add(circle);
    group.add(circle2);
    group.add(hitbox);

    group.userData.type = data.type;
    group.userData.id = data.id;
    group.position.copy(data.pos);
    group.visible = this.visible;
    if (data.rotation) group.rotation.z = data.rotation;
    this.sceneManager.scene.add(group);

    this.objects.set(data.id, {
      mesh: group,
      isSelected: false,
      isHovered: false,
      isInValid: false,
      type: data.type,
    });
    this.sceneManager.render();
  }

  protected updateFromData(data: GizmoData) {
    this.updateGizmo(data.id, data.pos, data.rotation);
  }

  updateGizmo(id: string, pos?: THREE.Vector3, rotation?: number) {
    const p = this.objects.get(id);
    if (!p) return;
    if (pos) p.mesh.position.copy(pos);
    if (rotation) p.mesh.rotation.z = rotation;
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

  getWorldPosition(id: string): THREE.Vector3 | null {
    return this.objects.get(id)?.mesh.position ?? null;
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

    const intersects = this.raycaster.intersectObjects(
      this.getHitboxes(),
      false,
    );
    const hoveredId = this.getFirstHoverableGizmo(intersects);
    this.setHovered(hoveredId);
    if (hoveredId) {
      return true;
    }
    return false;
  }
}
