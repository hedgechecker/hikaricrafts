import * as THREE from 'three';

interface PointRenderData {
  mesh: THREE.Group;
  isHovered: boolean;
  isSelected: boolean;
}

export class PointManager {
  private scene: THREE.Scene;
  private points = new Map<string, PointRenderData>();

  private readonly baseThickness = 1.0;
  private readonly hoverThickness = 2.0;
  private zoom: number = 1;

  private hovered: string | null = null;
  private selected: string[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
      color: 0x999999,
      transparent: true,
      opacity: 0.4, // semi-transparent center
    });

    const circle = new THREE.Mesh(geometry, material);

    // Outline
    const edges = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: 0x111111,
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
    hitbox.scale.set(size, size, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);
    group.userData.id = id;

    this.scene.add(group);

    this.points.set(id, {mesh: group, isSelected: false, isHovered:false});
    return group;
  }

  setHovered(id: string | null) {
    if (this.hovered) {
      const point = this.points.get(this.hovered);
      if (point != undefined) {
        point.isHovered = false;
      }
    }
    this.hovered = id;

    if (this.hovered) {
      const point = this.points.get(this.hovered);
      if (point != undefined) {
        point.isHovered = true;
      }
    }

    this.updateScale(this.zoom);
  }

  setSelected(ids: string[]) {
    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.isSelected = false;
        }
      });
    }
    this.selected = ids;

    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.isSelected = true;
        }
      });
    }
  }

  getHovered() {
    return this.hovered;
  }
  getSelected() {
    return this.selected;
  }

  hasPoint(id: string) {
    return this.points.has(id);
  }

  getAllIds(): string[] {
    return Array.from(this.points.keys());
  }

  setPosition(id: string, pos: THREE.Vector3) {
    const p = this.points.get(id);
    if (!p) return;
    p.mesh.position.copy(pos);
  }

  removePoint(id: string) {
    const p = this.points.get(id);
    if (!p) return;

    this.scene.remove(p.mesh);
    p.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });

    this.points.delete(id);
  }

  updateScale(zoom: number) {
    this.zoom = zoom;
    const size = this.baseThickness / zoom;
    this.points.forEach((point) => {
      const isHovered = point.isHovered;
      const isSelected = point.isSelected;
      point.mesh.children.forEach((child) => {
        if ((isHovered || isSelected) && child.name != 'hitbox') {
          child.scale.set(size * this.hoverThickness, size * this.hoverThickness, 1);
        } else {
          child.scale.set(size, size, 1);
        }
      });
    });
  }

  getPoints() {
    return this.points;
  }

  getHitboxes(): THREE.Object3D[] {
    let arr: THREE.Object3D<THREE.Object3DEventMap>[] = [];
    this.points.forEach((point) => {
      arr.push(point.mesh.getObjectByName('hitbox')!);
    });

    return arr;
  }

  getSnapCandidates(position: THREE.Vector3, threshold: number): THREE.Group[] {
    let closest: THREE.Group[] = [];
    this.points.forEach((point) => {
      const dist = point.mesh.position.distanceTo(position);

      if (dist < threshold) {
        closest.push(point.mesh);
      }
    });

    return closest;
  }
  getSnapCandidateIds(position: THREE.Vector3, threshold: number): string[] {
    let closest: string[] = [];
    this.points.forEach((point, id) => {
      const dist = point.mesh.position.distanceTo(position);

      if (dist < threshold) {
        closest.push(id);
      }
    });
    return closest;
  }
  getWorldPositionById(id: string): THREE.Vector3 | null {
    return this.points.get(id)?.mesh.position ?? null;
  }

  public getFirstHoverablePoint(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
      if (!id) continue;

      if (this.selected.length > 0 && id == this.selected[0]) continue;

      return id;
    }
    return null;
  }

  clear() {
    this.points.forEach((point) => {
      this.scene.remove(point.mesh);
    });
    this.points.clear();
  }
}
