import * as THREE from "three";

export class BackgroundImage {
  private scene: THREE.Scene;
  private mesh?: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setImage(url: string) {
    const loader = new THREE.TextureLoader();

    loader.load(url, texture => {
      if (this.mesh) {
        this.scene.remove(this.mesh);
      }

      const imageAspect =
        texture.image.width / texture.image.height;

      const height = 10;
      const width = height * imageAspect;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);
    });
  }
}
