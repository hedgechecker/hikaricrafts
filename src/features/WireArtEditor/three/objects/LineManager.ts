import * as THREE from 'three';
import { PointManager } from './PointManager';

interface LineRenderData {
  startId: string;
  endId: string;
  mesh: THREE.Line;
}

export class LineManager {
  private lines = new Map<string, LineRenderData>();
  private scene: THREE.Scene;
  private pointManager: PointManager;
  constructor(scene: THREE.Scene, pointManager: PointManager) {
    this.scene = scene;
    this.pointManager = pointManager;
  }

  // --------------------------------------------------

  addLine(startId: string, endId: string, id: string) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.lines.set(id, {
      startId,
      endId,
      mesh: line,
    });

    this.updateLineGeometry(id);
  }

  // --------------------------------------------------

  removeLine(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    this.scene.remove(data.mesh);
    data.mesh.geometry.dispose();
    (data.mesh.material as THREE.Material).dispose();

    this.lines.delete(id);
  }

  // --------------------------------------------------

  update() {
    for (const [id] of this.lines) {
      this.updateLineGeometry(id);
    }
  }

  // --------------------------------------------------

  clear() {
    for (const [id] of this.lines) {
      this.removeLine(id);
    }
  }

  // --------------------------------------------------

  private updateLineGeometry(id: string) {
    const data = this.lines.get(id);
    if (!data) return;

    const startPos = this.pointManager.getWorldPositionById(data.startId);
    const endPos = this.pointManager.getWorldPositionById(data.endId);

    if (!startPos || !endPos) return;

    data.mesh.geometry.setFromPoints([startPos.clone(), endPos.clone()]);
  }
}
