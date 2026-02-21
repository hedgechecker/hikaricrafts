import * as THREE from "three";

interface LineData {
  start: THREE.Group;
  end: THREE.Group;
  mesh: THREE.Line;
}

export class LineManager {
  private scene: THREE.Scene;
  private lines: LineData[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addLine(startPoint: THREE.Group, endPoint: THREE.Group) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8,
    });

    const line = new THREE.Line(geometry, material);

    this.scene.add(line);

    this.lines.push({
      start: startPoint,
      end: endPoint,
      mesh: line,
    });

    this.updateLineGeometry(this.lines[this.lines.length - 1]);
  }

  update() {
    for (const lineData of this.lines) {
      this.updateLineGeometry(lineData);
    }
  }

  private updateLineGeometry(lineData: LineData) {
    const startPos = lineData.start.position;
    const endPos = lineData.end.position;

    const points = [startPos.clone(), endPos.clone()];

    lineData.mesh.geometry.setFromPoints(points);
  }
}