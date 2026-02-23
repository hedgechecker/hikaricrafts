import * as THREE from 'three';
import { CameraController } from './core/CameraController';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: CameraController;

  private container: HTMLDivElement;
  private animationId?: number;
  private imageMesh?: THREE.Mesh;
  private url = '';

  constructor(container: HTMLDivElement) {
    this.container = container;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfaf7f2);

    const aspect = width / height;
    const frustumSize = 10;

    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      1000,
    );
    this.camera.updateProjectionMatrix();

    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
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
      this.camera.updateProjectionMatrix();
    };

    animate();
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.renderer.dispose();

    // Remove canvas from DOM safely
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    window.removeEventListener('resize', this.onResize);
  }
  getCameraController() {
    return this.cameraController;
  }

  setBackground(url: string) {
    this.url = url;
    const loader = new THREE.TextureLoader();
    loader.load(url, (texture) => {
      if (this.imageMesh) {
        this.scene.remove(this.imageMesh);
      }

      const imageAspect = texture.image.width / texture.image.height;

      const height = 10;
      const width = height * imageAspect;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
      });

      this.imageMesh = new THREE.Mesh(geometry, material);
      this.imageMesh.position.setZ(-5);
      this.scene.add(this.imageMesh);
    });
  }

  getBackground() {
    return this.url;
  }

}
