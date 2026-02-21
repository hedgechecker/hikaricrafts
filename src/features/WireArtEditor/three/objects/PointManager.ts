import * as THREE from "three";

export class PointManager {
  private scene: THREE.Scene;
  private points: THREE.Group[] = [];
  private baseSize = 1.0;
  private hoverScale = 2.0;

  private hovered: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addPoint(position: THREE.Vector3) {
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

    circle.name = "visual";
    outline.name = "outline";

    const hitGeometry = new THREE.CircleGeometry(hitRadius, 32);

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0, // invisible
      depthWrite: false,
    });

    const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
    hitbox.name = "hitbox";

    circle.scale.set(0, 0, 1);
    outline.scale.set(0, 0, 1);
    hitbox.scale.set(0, 0, 1);
    group.add(circle);
    group.add(outline);
    group.add(hitbox);


    this.scene.add(group);
    this.points.push(group);
    return group;
  }

  setHovered(point: THREE.Group | null) {
    if (this.hovered === point) return;

    // Reset previous
    if (this.hovered) {
      this.hovered.userData.isHovered = false;
    }

    this.hovered = point;

    if (this.hovered) {
      this.hovered.userData.isHovered = true;
    }

  }

  getHovered() {
    return this.hovered;
  }

  updateScale(zoom: number) {
    const scaleMultiplier = this.hoverScale;
    const size = this.baseSize / zoom;
    const scaledSize = size * scaleMultiplier;
    this.points.forEach(group => {
      const isHovered = group.userData.isHovered;
      group.children.forEach(child => {
        if(isHovered && child.name != "hitbox"){
          child.scale.set(scaledSize, scaledSize, 1);
        }else{
          child.scale.set(size, size, 1);
        }
      });

    });
  }

  getPoints() {
    return this.points;
  }

  getHitboxes(): THREE.Object3D[] {
    return this.points.map(group =>
      group.getObjectByName("hitbox")!
    );
  }

  getSnapCandidate(
    position: THREE.Vector3,
    threshold: number
  ): THREE.Group | null {
    let closest: THREE.Group | null = null;
    let minDist = Infinity;
  
    for (const group of this.points) {
      const dist = group.position.distanceTo(position);
    
      if (dist < threshold && dist < minDist) {
        closest = group;
        minDist = dist;
      }
    }
  
    return closest;
  }

}
