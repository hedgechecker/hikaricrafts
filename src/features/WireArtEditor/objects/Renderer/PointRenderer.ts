import * as THREE from 'three';
import type { PointData } from '../../models/Point';
import { BaseRenderer } from './BaseRenderer';

interface PointRenderData {
  mesh: THREE.Group;
  isHovered: boolean;
  isSelected: boolean;
  isInValid: boolean;
}

export class PointRenderer extends BaseRenderer<PointRenderData, PointData> {
  private readonly baseThickness = 1.0;
  private readonly hoverThickness = 2.0;

  private color = '#999999';

  protected getId(data: PointData) {
    return data.id;
  }
  protected addFromData(data: PointData) {
    this.addPoint(new THREE.Vector3(data.x, data.y, data.z), data.id);
  }
  protected updateFromData(data: PointData) {
    this.setPosition(data.id, new THREE.Vector3(data.x, data.y, data.z));
  }

  updateScale(zoom: number) {
    this.zoom = zoom;
    const size = this.baseThickness / zoom;
    this.objects.forEach((object, id) => {
      const isHovered = object.isHovered;
      const isSelected = object.isSelected;
      const isInValid = object.isInValid;
      
      object.mesh.children.forEach((child) => {
        if ((isHovered || isSelected) && child.name != 'hitbox') {
          child.scale.set(size * this.hoverThickness, size * this.hoverThickness, 1);
        } else {
          child.scale.set(size, size, 1);
        }
        if (isInValid) {
          this.setColor(id, this.colorInValid);
        } else {
          this.setColor(id, this.color);
        }
      });
    });
  }

  addPoint(position: THREE.Vector3, id: string) {
    const group = new THREE.Group();
    group.position.copy(position);

    const baseRadius = 0.07;
    const hitRadius = 0.25; // bigger for easier hover

    // -----------------------------
    // Visible Circle (Outline + Fill)
    // -----------------------------

    const geometry = new THREE.CircleGeometry(baseRadius, 32);

    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.4, // semi-transparent center
    });

    const circle = new THREE.Mesh(geometry, material);

    // Outline
    const edges = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: this.color,
    });

    const outline = new THREE.LineSegments(edges, outlineMaterial);

    circle.name = 'visual';
    outline.name = 'outline';

    const hitGeometry = new THREE.CircleGeometry(hitRadius, 32);

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0, // invisible
      depthWrite: false,
    });

    const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
    hitbox.name = 'hitbox';
    const size = this.baseThickness / this.zoom;
    circle.scale.set(size, size, 1);
    outline.scale.set(size, size, 1);
    outline.position.z = 0.001;
    hitbox.scale.set(size, size, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);
    group.userData.id = id;

    if (this.visible) this.sceneManager.scene.add(group);

    this.objects.set(id, { mesh: group, isSelected: false, isHovered: false, isInValid: false });
    return group;
  }

  setPosition(id: string, pos: THREE.Vector3) {
    const p = this.objects.get(id);
    if (!p) return;
    p.mesh.position.copy(pos);
  }

  getWorldPosition(id: string): THREE.Vector3 | null {
    return this.objects.get(id)?.mesh.position ?? null;
  }

  getFirstHoverablePoint(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
      if (!id) continue;

      const selected = this.selected.some((image) => image == id);
      if (selected) continue;

      return id;
    }
    return null;
  }

  setColorAll(color: string) {
    if (this.color == color) return;
    this.color = color;

    this.objects.forEach((_point, id) => {
      this.setColor(id, color);
    });
  }

  setColor(id: string, color: string) {
    const newColor = new THREE.Color(color);

    const point = this.objects.get(id);
    if (!point) return;
    const visual = point.mesh.getObjectByName('visual');
    const outline = point.mesh.getObjectByName('outline');

    if (visual && (visual as THREE.Mesh).material) {
      ((visual as THREE.Mesh).material as THREE.Material & { color: THREE.Color }).color.copy(
        newColor,
      );
    }

    if (outline && (outline as THREE.Mesh).material) {
      ((outline as THREE.Mesh).material as THREE.Material & { color: THREE.Color }).color.copy(
        newColor,
      );
    }
  }

  handleHover(event: MouseEvent): boolean {
    const rect = this.sceneManager.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);

    const intersects = raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredPointId = this.getFirstHoverablePoint(intersects);
    if (hoveredPointId) {
      this.setHovered(hoveredPointId);
      return true;
    }
    return false;
  }
}
