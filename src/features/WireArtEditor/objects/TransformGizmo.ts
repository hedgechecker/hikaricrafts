import * as THREE from 'three';
import type { ImageRenderData } from './ImageRenderer';

export class TransformGizmo {
  handles: THREE.Group[] = [];
  hovered: string = 'none';
  visible = false;
  parent: ImageRenderData | null = null;

  constructor() {
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group();
      const baseRadius = 0.1;
      const hitRadius = 0.25;

      const geometry = new THREE.CircleGeometry(baseRadius, 32);

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });

      const circle = new THREE.Mesh(geometry, material);

      // Outline
      const edges = new THREE.EdgesGeometry(geometry);
      const outlineMaterial = new THREE.LineBasicMaterial({
        color: 0x000000,
      });

      const outline = new THREE.LineSegments(edges, outlineMaterial);

      circle.name = 'visual';
      outline.name = 'outline';

      const hitGeometry = new THREE.CircleGeometry(hitRadius, 32);

      const hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
      hitbox.name = 'hitbox';
      const size = 1.0;
      circle.scale.set(size, size, 1);
      outline.scale.set(size, size, 1);
      hitbox.scale.set(size, size, 1);
      group.add(circle);
      group.add(outline);
      group.add(hitbox);

      group.userData.type = i === 4 ? 'rotate' : 'resize';
      group.userData.corner = i;
      this.handles.push(group);
    }
  }

  getHitboxes() {
    if (!this.visible) return [];
    let arr: THREE.Object3D<THREE.Object3DEventMap>[] = [];
    this.handles.forEach((handle) => {
      arr.push(handle.getObjectByName('hitbox')!);
    });

    return arr;
  }

  setHovered(type: string) {
    this.hovered = type;
  }
  getHovered() {
    return this.hovered;
  }

  update(image: ImageRenderData | null) {
    if (!image) {
      this.handles.forEach((h) => {
        h.visible = this.visible;
      });
      return;
    }

    this.parent = image;

    const width = image.height * image.aspect;
    const halfW = width / 2;
    const halfH = image.height / 2;
    const rotateOffset = 0.6;

    const corners = [
      [-halfW, halfH], // TL
      [halfW, halfH], // TR
      [halfW, -halfH], // BR
      [-halfW, -halfH], // BL
      [0, halfH + rotateOffset], // ROTATE
    ];

    const centerX = image.mesh.position.x;
    const centerY = image.mesh.position.y;

    const cos = Math.cos(image.data.rotation);
    const sin = Math.sin(image.data.rotation);

    this.handles.forEach((h, i) => {
      h.visible = this.visible;

      const [ox, oy] = corners[i];

      // rotate offset
      const rx = ox * cos - oy * sin;
      const ry = ox * sin + oy * cos;

      h.position.set(centerX + rx, centerY + ry, 5);
    });
  }
}
