import * as THREE from "three";

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;

  private container: HTMLDivElement;
  private animationId?: number;

  constructor(container: HTMLDivElement) {
    this.container = container;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x313131);

    const aspect = width / height;
    const frustumSize = 10;

    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      1000
    );

    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.onResize);
  }

  private onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    const frustumSize = 10;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  start() {
    const animate = () => {
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  dispose() {
  if (this.animationId) cancelAnimationFrame(this.animationId);

  this.renderer.dispose();

  // Remove canvas from DOM safely
  if (this.renderer.domElement.parentNode) {
    this.renderer.domElement.parentNode.removeChild(
      this.renderer.domElement
    );
  }

  window.removeEventListener("resize", this.onResize);
}

}
