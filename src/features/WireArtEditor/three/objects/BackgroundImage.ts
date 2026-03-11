import * as THREE from 'three';
import type { ImageData } from '../../models/DataModel';

export class BackgroundImage {
  mesh: THREE.Mesh;
  aspect = 1;
  height = 10;
  isHovered = false;
  data: ImageData;

  constructor(texture: THREE.Texture, image: ImageData) {
    this.aspect = texture.image.width / texture.image.height;

    const geometry = new THREE.PlaneGeometry(this.height * this.aspect, this.height);

    const material = new THREE.MeshBasicMaterial({ map: texture });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = -5;
    this.mesh.position.x = image.x;
    this.mesh.position.y = image.y;
    this.mesh.userData.id = image.id;
    this.data = image;
    this.setHeight(this.data.height);
  }

  setHeight(height: number) {
    if(!height)return;
    this.height = height;

    const width = this.height * this.aspect;

    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(width, this.height);
  }
}
