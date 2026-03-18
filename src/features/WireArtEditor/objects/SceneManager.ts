import * as THREE from 'three';
import { CameraController } from './CameraController';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: CameraController;
  dom: HTMLCanvasElement;

  private overlay!: HTMLDivElement;
  private gridLabel!: HTMLDivElement;
  container: HTMLDivElement;
  private animationId?: number;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

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
    this.dom = this.renderer.domElement;

    

    container.appendChild(this.renderer.domElement);
    container.appendChild(this.createOverlay(container));

    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  createOverlay(container: HTMLDivElement) {
    const overlay = document.createElement('div');

    overlay.style.position = 'absolute';
    overlay.style.top = container.offsetTop + container.clientTop + 'px';
    overlay.style.left = container.offsetLeft + container.clientLeft + 'px';
    overlay.style.width = container.clientWidth + 'px';
    overlay.style.height = container.clientHeight + 'px';

    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';

    // ---- GRID SIZE LABEL ----
    const gridLabel = document.createElement('div');
    gridLabel.style.position = 'absolute';
    gridLabel.style.bottom = '10px';
    gridLabel.style.left = '10px';
    gridLabel.style.padding = '4px 8px';
    gridLabel.style.background = 'rgba(0,0,0,0.6)';
    gridLabel.style.color = '#fff';
    gridLabel.style.fontFamily = 'monospace';
    gridLabel.style.fontSize = '12px';
    gridLabel.style.borderRadius = '4px';

    overlay.appendChild(gridLabel);

    this.gridLabel = gridLabel;
    this.overlay = overlay;

    return overlay;
  }

  onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    const referenceWidth = 1200; // "desktop baseline"
    const scale = width / referenceWidth;
    
    const frustumSize = 10*scale;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  update() {
    this.camera.updateProjectionMatrix();
    this.updateOverlay();
  }

  updateOverlay() {
    //const step = this.getGridStep() * 10;
    const step = 0;

    const cameraPos = this.camera.position;

    this.gridLabel.innerText =
      `Grid: ${step.toFixed(4)} mm\n` +
      `Zoom: ${this.camera.zoom.toFixed(2)}\n` +
      `Center: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)})`;
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.renderer.dispose();
    this.container.removeChild(this.overlay);

    // Remove canvas from DOM safely
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    window.removeEventListener('resize', this.onResize);
  }

  getCameraController() {
    return this.cameraController;
  }


  getWorldPosition(event: MouseEvent): THREE.Vector3 {
    const rect = this.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection;
  }
}
