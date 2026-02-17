import * as THREE from "three";

export class PointManager {
  private scene: THREE.Scene;
  private points: THREE.Mesh[] = [];
  private size = 0.5; 

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addPoint(position: THREE.Vector3, cameraZoom: number = 1) {
    const geometry = new THREE.CircleGeometry(0.15, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(position);
    circle.scale.set(0, 0, 1); // initial screen size
    // multiply by zoom so we can adjust later if needed
    circle.scale.multiplyScalar(1 / cameraZoom);

    this.scene.add(circle);
    this.points.push(circle);
  }

  updateScale(zoom: number) {
    this.points.forEach(point => {
      point.scale.set(this.size, this.size, 1).multiplyScalar(1 / zoom);
    });
  }
}
