import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { PatternData } from "../../models/Pattern";

export class PatternRenderer extends BaseRenderer<RenderData, PatternData> {
  private readonly baseThickness = 1.0;
  private readonly hoverThickness = 2.0;
  private readonly baseRadius = 0.09;
  private readonly hitRadius = 0.2;

  private color = "#999999";

  protected getId(data: PatternData) {
    return data.id;
  }
  public addFromData(data: PatternData) {
    const group = new THREE.Group();
    group.position.copy(new THREE.Vector3(data.x, data.y, data.z));

    const geometry = new THREE.CircleGeometry(this.baseRadius, 32);

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

    circle.name = "visual";
    outline.name = "outline";

    const hitGeometry = new THREE.CircleGeometry(this.hitRadius, 32);

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
    hitbox.name = "hitbox";
    const size = this.baseThickness / this.zoom;
    circle.scale.set(size, size, 1);
    outline.scale.set(size, size, 1);
    outline.position.z = 0.001;
    hitbox.scale.set(size, size, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);
    group.userData.id = data.id;

    group.visible = this.visible;
    this.sceneManager.scene.add(group);

    this.objects.set(data.id, {
      mesh: group,
      isSelected: false,
      isHovered: false,
      isInValid: false,
    });
    this.sceneManager.render();
    return group;
  }

  protected updateFromData(data: PatternData) {
    this.setPosition(data.id, new THREE.Vector3(data.x, data.y, data.z));
  }

  update(zoom: number, id?: string) {
    this.zoom = zoom;
    const size = this.baseThickness / zoom;

    if (id) {
      const object = this.objects.get(id);
      if (!object) return;
      const isHovered = object.isHovered;
      const isSelected = object.isSelected;
      const isInValid = object.isInValid;

      object.mesh.visible =
        this.visible || isHovered || isSelected || isInValid;

      object.mesh.children.forEach((child) => {
        if ((isHovered || isSelected) && child.name != "hitbox") {
          child.scale.set(
            size * this.hoverThickness,
            size * this.hoverThickness,
            1,
          );
          child.visible = true;
        } else {
          child.scale.set(size, size, 1);
        }
        if (isInValid) {
          this.setColor(id, this.colorInValid);
        } else {
          this.setColor(id, this.color);
        }
      });
      return;
    }

    this.objects.forEach((object, id) => {
      const isHovered = object.isHovered;
      const isSelected = object.isSelected;
      const isInValid = object.isInValid;

      object.mesh.visible =
        this.visible || isHovered || isSelected || isInValid;

      object.mesh.children.forEach((child) => {
        if ((isHovered || isSelected) && child.name != "hitbox") {
          child.scale.set(
            size * this.hoverThickness,
            size * this.hoverThickness,
            1,
          );
          child.visible = true;
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

  setPosition(id: string, pos: THREE.Vector3) {
    const p = this.objects.get(id);
    if (!p) return;
    p.mesh.position.copy(pos);
    this.sceneManager.render();
  }

  getWorldPosition(id: string): THREE.Vector3 | null {
    return this.objects.get(id)?.mesh.position ?? null;
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
    const visual = point.mesh.getObjectByName("visual");
    const outline = point.mesh.getObjectByName("outline");

    if (visual && (visual as THREE.Mesh).material) {
      (
        (visual as THREE.Mesh).material as THREE.Material & {
          color: THREE.Color;
        }
      ).color.copy(newColor);
    }

    if (outline && (outline as THREE.Mesh).material) {
      (
        (outline as THREE.Mesh).material as THREE.Material & {
          color: THREE.Color;
        }
      ).color.copy(newColor);
    }
  }

  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);
    let hoveredPointId = null;
    const thres = 0.1 / this.zoom;
    
    for (const object of this.objects) {
      const pos = object[1].mesh.position;
      if (
        Math.pow(pos.x - worldPos.x, 2) + Math.pow(pos.y - worldPos.y, 2) < thres 
        && (this.selected.length != 1 || !this.selected.some((point) => point == object[0]))
      ) {
        hoveredPointId = object[0];
        this.setHovered(hoveredPointId);
        return true;
      }
    }
    return false;
  }
}
