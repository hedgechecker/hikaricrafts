import * as THREE from 'three';
import { CameraController } from './core/CameraController';
export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: CameraController;

  private overlay!: HTMLDivElement;
  private gridLabel!: HTMLDivElement;
  private container: HTMLDivElement;
  private animationId?: number;
  private imageMesh?: THREE.Mesh;
  private url = '';
  private grid = this.createCustomGrid(20);
  private size: number = 200;
  private hovered: THREE.Vector3 | null = null;

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

  update() {
    this.camera.updateProjectionMatrix();
    this.updateGrid();
    this.updateOverlay();
  }

  updateGrid() {
    const newDivisions = this.getSubdivisionDivisions(this.camera.zoom);
    if (this.grid.userData.divisions !== newDivisions) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      this.grid.material.dispose();

      this.grid = this.createCustomGrid(newDivisions);
      this.grid.userData.divisions = newDivisions;
      this.scene.add(this.grid);
    }
  }

  updateOverlay() {
    const step = this.getGridStep()*10;

    const cameraPos = this.camera.position;

    this.gridLabel.innerText =
      `Grid: ${step.toFixed(4)} mm\n` +
      `Zoom: ${this.camera.zoom.toFixed(2)}\n` +
      `Center: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)})`;
  }

  getSubdivisionDivisions(cameraZoom: number) {
    if (cameraZoom > 5) return 2000; //1mm
    if (cameraZoom > 1.6) return 400; //5mm
    if (cameraZoom > 0.8) return 200; //10mm
    if (cameraZoom > 0.2) return 80; //25mm
    if (cameraZoom > 0.1) return 40; //50mm
    return 20; //100mm
  }

  snapToGrid(worldPos: THREE.Vector3) {
    const step = this.size / this.getSubdivisionDivisions(this.camera.zoom);

    const snappedX = Math.round(worldPos.x / step) * step;
    const snappedY = Math.round(worldPos.y / step) * step;

    const point = new THREE.Vector3(snappedX, snappedY, 0);

    if (worldPos.distanceTo(point) < step / 6) {
      return point;
    }

    return null;
  }

  createCustomGrid(divisions: number) {
    const halfSize = this.size / 2;
    const step = this.size / divisions;

    const vertices = [];
    const colors = [];

    const colorMinor = new THREE.Color(0x888888); // minor lines
    const colorMajor = new THREE.Color(0x222222); // minor lines
    const colorXCenter = new THREE.Color(0xaa0000); // center X
    const colorZCenter = new THREE.Color(0x00aa00); // center Z

    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      const isMajor = i % 5 === 0;

      const color = isMajor ? colorMajor : colorMinor;
      // Line along X (parallel to X-axis, Z = pos)
      let colorLineX = color.clone();
      if (pos === 0) colorLineX = colorXCenter.clone();

      vertices.push(-halfSize, pos, 0, halfSize, pos, 0); // 2 vertices
      colors.push(colorLineX.r, colorLineX.g, colorLineX.b);
      colors.push(colorLineX.r, colorLineX.g, colorLineX.b);

      // Line along Z (parallel to Z-axis, X = pos)
      let colorLineZ = color.clone();
      if (pos === 0) colorLineZ = colorZCenter.clone();

      vertices.push(pos, -halfSize, 0, pos, halfSize, 0); // 2 vertices
      colors.push(colorLineZ.r, colorLineZ.g, colorLineZ.b);
      colors.push(colorLineZ.r, colorLineZ.g, colorLineZ.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true });
    const grid = new THREE.LineSegments(geometry, material);
    return grid;
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.scene.remove(this.grid);
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
  getHovered() {
    return this.hovered;
  }
  getGridStep(): number {
    const divisions = this.getSubdivisionDivisions(this.camera.zoom);
    return this.size / divisions;
  }

  setHovered(point: THREE.Vector3 | null) {
    this.hovered = point;
  }

  setBackground(url: string| undefined) {
    if(!url){
      if(this.imageMesh){
        this.scene.remove(this.imageMesh);
        this.imageMesh = undefined;
      }
      return;
    }
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
