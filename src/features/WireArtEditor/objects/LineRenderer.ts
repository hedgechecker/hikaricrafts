import * as THREE from 'three';
import { PointRenderer } from './PointRenderer';
import type { SceneManager } from './SceneManager';

interface LineRenderData {
  startPointId: string;
  endPointId: string;
  mesh: THREE.Group;
  isHovered: boolean;
  isSelected: boolean;
}

export class LineRenderer {
  private lines = new Map<string, LineRenderData>();
  private sceneManager: SceneManager;
  private pointManager: PointRenderer;
  private hovered: string | null = null;

  private zoom: number = 1;
  private readonly baseThickness = 0.02;
  private readonly hoverThickness = 0.05;
  private color: THREE.Color = new THREE.Color(0x000000);

  constructor(sceneManager: SceneManager, pointManager: PointRenderer) {
    this.sceneManager = sceneManager;
    this.pointManager = pointManager;
  }

  addLine(startPointId: string, endPointId: string, id: string) {
    const group = new THREE.Group();
    group.userData.id = id;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
    });
    const lineMesh = new THREE.Mesh(geometry, material);
    lineMesh.name = 'visual';

    const hitGeometry = new THREE.BoxGeometry(1, 10, 1);
    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitboxMesh = new THREE.Mesh(hitGeometry, hitMaterial);
    hitboxMesh.name = 'hitbox';

    group.add(lineMesh);
    group.add(hitboxMesh);
    this.sceneManager.scene.add(group);

    this.lines.set(id, {
      startPointId: startPointId,
      endPointId: endPointId,
      mesh: group,
      isHovered: false,
      isSelected: false,
    });

    this.updateLineGeometry(id);
  }

  public setHovered(id: string | null) {
    if (id === this.hovered) return;
    if (this.hovered) {
      const line = this.lines.get(this.hovered);
      if (line != undefined) {
        line.isHovered = false;
      }
    }
    this.hovered = id;

    if (this.hovered) {
      const line = this.lines.get(this.hovered);
      if (line != undefined) {
        line.isHovered = true;
      }
    }
    this.updateScale(this.zoom);
  }
  getHitboxes(): THREE.Object3D[] {
    let arr: THREE.Object3D<THREE.Object3DEventMap>[] = [];
    this.lines.forEach((line) => {
      arr.push(line.mesh.getObjectByName('hitbox')!);
    });

    return arr;
  }

  public getConnectedPoints(pointId: string): string[] {
    const connected: string[] = [];
    for (const [, line] of this.lines) {
      if (line.startPointId === pointId) {
        connected.push(line.endPointId);
      } else if (line.endPointId === pointId) {
        connected.push(line.startPointId);
      }
    }
    return connected;
  }

  public isConnectedToPoint(lineId: string, pointId: string): boolean {
    const line = this.lines.get(lineId);
    if (!line) return false;

    return line.startPointId === pointId || line.endPointId === pointId;
  }

  public getFirstHoverableLine(intersects: THREE.Intersection[]): string | null {
    const selectedPoints = this.pointManager.getSelected();
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
      if (!id) continue;

      const connected = selectedPoints.some((point) => this.isConnectedToPoint(id, point));
      if (connected) continue;

      return id;
    }
    return null;
  }

  getHovered() {
    if (!this.hovered) return null;
    const data = this.lines.get(this.hovered);
    if (!data) return null;
    return { id: this.hovered, ...data };
  }

  removeLine(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    this.sceneManager.scene.remove(data.mesh);
    data.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });

    this.lines.delete(id);
  }

  public hasLineBetween(a: string, b: string): boolean {
    for (const [, line] of this.lines) {
      const s = line.startPointId;
      const e = line.endPointId;

      if ((s === a && e === b) || (s === b && e === a)) {
        return true;
      }
    }

    return false;
  }

  update() {
    for (const [id] of this.lines) {
      this.updateLineGeometry(id);
    }
  }

  clear() {
    for (const [id] of this.lines) {
      this.removeLine(id);
    }
  }

  hasLine(id: string) {
    return this.lines.has(id);
  }

  getAllIds(): string[] {
    return Array.from(this.lines.keys());
  }

  updateConnection(id: string, startPointId: string, endPointId: string) {
    const line = this.lines.get(id);
    if (!line) return;

    line.startPointId = startPointId;
    line.endPointId = endPointId;

    this.updateLineGeometry(id);
  }

  private updateLineGeometry(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    const startPos = this.pointManager.getWorldPosition(data.startPointId);
    const endPos = this.pointManager.getWorldPosition(data.endPointId);

    if (!startPos || !endPos) return;

    const mesh = data.mesh;

    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const length = direction.length();

    if (length === 0) return;

    // Position: midpoint
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    mesh.position.copy(midpoint);

    // Orientation: align X axis to direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize());
    mesh.setRotationFromQuaternion(quaternion);

    // Scale:
    // X = length
    // Y = thickness
    // Z = thickness (gives slight depth)
    const thickness =
      this.hovered === id ? this.hoverThickness / this.zoom : this.baseThickness / this.zoom;

    mesh.scale.set(length, thickness, thickness);
  }

  updateScale(zoom: number) {
    this.zoom = zoom;
    for (const [id, line] of this.lines) {
      const startPos = this.pointManager.getWorldPosition(line.startPointId);
      const endPos = this.pointManager.getWorldPosition(line.endPointId);

      if (!startPos || !endPos) continue;

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();

      if (length === 0) continue;

      const thickness =
        this.hovered === id ? this.hoverThickness / zoom : this.baseThickness / zoom;
      line.mesh.scale.set(length, thickness, thickness);
    }
  }

  setLineColor(color: string) {
    const newColor = new THREE.Color(color);

    if (this.color && this.color.equals(newColor)) return;

    this.color = newColor;

    this.lines.forEach((line) => {
      const visual = line.mesh.getObjectByName('visual');
      if (visual && (visual as THREE.Mesh).material) {
        ((visual as THREE.Mesh).material as THREE.Material & { color: THREE.Color }).color.copy(
          this.color,
        );
      }
    });
  }

  handleHover(event: MouseEvent): boolean {
    const rect = this.sceneManager.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);

    const intersects = raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredLine = this.getFirstHoverableLine(intersects);
    if (hoveredLine) {
      this.setHovered(hoveredLine);
      return true;
    }
    return false;
  }
}
