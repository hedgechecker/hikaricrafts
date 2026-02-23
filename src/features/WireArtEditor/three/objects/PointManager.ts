import * as THREE from 'three';

export class PointManager {
  private scene: THREE.Scene;
  private points = new Map<string, THREE.Group>();
  private baseSize = 1.0;
  private hoverScale = 2.0;

  private hovered: string[] = [];
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

    circle.scale.set(0, 0, 1);
    outline.scale.set(0, 0, 1);
    hitbox.scale.set(0, 0, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);
    group.userData.id = id;

    this.scene.add(group);

    this.points.set(id, group);
    // this.storage.addPoint({ x: position.x, y: position.y }, id);
    return group;
  }

  setHovered(ids: string[]) {
    var points: THREE.Group<THREE.Object3DEventMap>[] = [];
    ids.forEach((id) => {
      const point = this.points.get(id) ?? null;
      if (point) points.push(point);
    });

    if (this.hovered.length > 0) {
      this.hovered.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.userData.isHovered = false;
        }
      });
    }
    this.hovered = ids;

    if (this.hovered.length > 0) {
      this.hovered.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.userData.isHovered = true;
        }
      });
    }
  }

  setSelected(ids: string[]) {
    var points: THREE.Group<THREE.Object3DEventMap>[] = [];
    ids.forEach((id) => {
      const point = this.points.get(id) ?? null;
      if (point) points.push(point);
    });

    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.userData.isSelected = false;
        }
      });
    }
    this.selected = ids;

    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const point = this.points.get(id);
        if (point != undefined) {
          point.userData.isSelected = true;
        }
      });
    }
  }

  public setVisualPosition(id: string, position: THREE.Vector3) {
    const group = this.points.get(id);
    if (!group) return;

    group.position.copy(position);
  }

  getHovered() {
    return this.hovered;
  }
  getSelected() {
    return this.selected;
  }

  updateScale(zoom: number) {
    const scaleMultiplier = this.hoverScale;
    const size = this.baseSize / zoom;
    const scaledSize = size * scaleMultiplier;
    this.points.forEach((group) => {
      const isHovered = group.userData.isHovered;
      const isSelected = group.userData.isSelected;
      group.children.forEach((child) => {
        if ((isHovered || isSelected) && child.name != 'hitbox') {
          child.scale.set(scaledSize, scaledSize, 1);
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
      arr.push(point.getObjectByName('hitbox')!);
    });

    return arr;
  }

  getSnapCandidates(position: THREE.Vector3, threshold: number): THREE.Group[] {
    let closest: THREE.Group[] = [];
    let minDist = Infinity;

    for (const group of this.points.values()) {
      const dist = group.position.distanceTo(position);

      if (dist < threshold && dist < minDist) {
        closest.push(group);
        minDist = dist;
      }
    }

    return closest;
  }
  getSnapCandidateIds(position: THREE.Vector3, threshold: number): string[] {
    let closest: THREE.Group[] = [];
    let minDist = Infinity;

    for (const group of this.points.values()) {
      const dist = group.position.distanceTo(position);

      if (dist < threshold && dist < minDist) {
        closest.push(group);
        minDist = dist;
      }
    }

    let ids: string[] = [];
    closest.forEach((closer) => {
      ids.push(closer?.userData.id);
    });
    return ids;
  }
  getWorldPositionById(id: string): THREE.Vector3 | null {
    return this.points.get(id)?.position ?? null;
  }

  clear() {
    this.points.forEach((point) => {
      this.scene.remove(point);
    });
    this.points = new Map<string, THREE.Group>();
  }
}
