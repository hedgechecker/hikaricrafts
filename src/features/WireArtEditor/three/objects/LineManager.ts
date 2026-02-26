import * as THREE from 'three';
import { PointManager } from './PointManager';

interface LineRenderData {
  startId: string;
  endId: string;
  mesh: THREE.Mesh;
}

export class LineManager {
  private lines = new Map<string, LineRenderData>();
  private scene: THREE.Scene;
  private pointManager: PointManager;
  private hovered: string | null = null;

  private zoom: number = 1;
  private readonly baseThickness = 0.02;
  private readonly hoverThickness = 0.05;

  constructor(scene: THREE.Scene, pointManager: PointManager) {
    this.scene = scene;
    this.pointManager = pointManager;
  }

  addLine(startId: string, endId: string, id: string) {
    // Unit box: length = 1 (X axis), thickness = 1 (Y), depth = 1 (Z)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.id = id;

    this.scene.add(mesh);

    this.lines.set(id, {
      startId,
      endId,
      mesh,
    });

    this.updateLineGeometry(id);
  }

  public setHovered(id: string | null) {
    if (id === this.hovered) return;
    if (this.hovered) {
      const line = this.lines.get(this.hovered);
      if (line != undefined) {
        line.mesh.userData.isHovered = false;
      }
    }
    this.hovered = id;

    if (this.hovered) {
      const line = this.lines.get(this.hovered);
      if (line != undefined) {
        line.mesh.userData.isHovered = true;
      }
    }
    this.updateScale(this.zoom);
  }

  getHitboxes(): THREE.Object3D[] {
    return Array.from(this.lines.values()).map((l) => l.mesh);
  }

  public getConnectedPoints(pointId: string): string[] {
    const connected: string[] = [];
    for (const [, line] of this.lines) {
      if (line.startId === pointId) {
        connected.push(line.endId);
      }else if(line.endId === pointId){
        connected.push(line.startId);
      }
    }
    return connected;
  }

  public isConnectedToPoint(lineId: string, pointId: string): boolean {
    const line = this.lines.get(lineId);
    if (!line) return false;

    return line.startId === pointId || line.endId === pointId;
  }

  public getFirstHoverableLine(
    intersects: THREE.Intersection[],
    excludedPointId: string | null,
  ): string | null {
    for (const hit of intersects) {
      const id = hit.object.userData.id;
      if (!id) continue;

      if (excludedPointId && this.isConnectedToPoint(id, excludedPointId)) continue;

      return id;
    }
    return null;
  }

  getHovered() {
    return this.hovered;
  }

  removeLine(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    this.scene.remove(data.mesh);
    data.mesh.geometry.dispose();
    (data.mesh.material as THREE.Material).dispose();

    this.lines.delete(id);
  }

  public hasLineBetween(a: string, b: string): boolean {
    for (const [, line] of this.lines) {
      const s = line.startId;
      const e = line.endId;

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

  updateConnection(id: string, startId: string, endId: string) {
    const line = this.lines.get(id);
    if (!line) return;

    line.startId = startId;
    line.endId = endId;

    this.updateLineGeometry(id);
  }

  private updateLineGeometry(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    const startPos = this.pointManager.getWorldPositionById(data.startId);
    const endPos = this.pointManager.getWorldPositionById(data.endId);

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
      const startPos = this.pointManager.getWorldPositionById(line.startId);
      const endPos = this.pointManager.getWorldPositionById(line.endId);

      if (!startPos || !endPos) continue;

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();

      if (length === 0) continue;

      const thickness =
        this.hovered === id ? this.hoverThickness / zoom : this.baseThickness / zoom;
      line.mesh.scale.set(length, thickness, thickness);
    }
  }
}
