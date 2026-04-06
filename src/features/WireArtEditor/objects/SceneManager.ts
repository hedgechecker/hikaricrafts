import * as THREE from "three";
import { CameraController } from "./CameraController";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type CameraMode = "2D" | "3D";

export class SceneManager {
  scene: THREE.Scene;

  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  orthoCamera: THREE.OrthographicCamera;
  perspectiveCamera: THREE.PerspectiveCamera;

  controller!: CameraController | OrbitControls;
  mode: CameraMode = "2D";

  renderer: THREE.WebGLRenderer;
  dom: HTMLCanvasElement;

  private overlay!: HTMLDivElement;
  private gridLabel!: HTMLDivElement;
  container: HTMLDivElement;
  private animationId?: number;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private mouse = new THREE.Vector2(0, 0);
  private count = 0;

  constructor(container: HTMLDivElement) {
    container.appendChild(this.createOverlay(container));
    this.container = container;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfaf7f2);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const light = new THREE.SpotLight(0xffffff, 150, 100, Math.PI / 3, 0, 1);
    light.position.set(0, 0, 50);
    light.lookAt(0, 0, 0);
    this.scene.add(light);
    const aspect = width / height;
    const frustumSize = 10;

    // ORTHO
    this.orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      1000,
    );
    this.orthoCamera.position.set(0, 0, 10);
    this.orthoCamera.zoom = 0.1;

    // PERSPECTIVE
    this.perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.perspectiveCamera.position.set(0, 0, 10);
    this.perspectiveCamera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    this.dom = this.renderer.domElement;
    container.appendChild(this.dom);

    // active camera
    this.camera = this.orthoCamera;
    this.setCameraMode("2D");

    window.addEventListener("resize", this.onResize);
    this.renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault(),
    );

    setInterval(() => {
      //console.log("renders/sec:", this.count);
      this.count = 0;
      this.render();
    }, 1000);
  } 

  render() {
    this.count++;
    this.renderer.render(this.scene, this.camera);
  }

  createOverlay(container: HTMLDivElement) {
    const overlay = document.createElement("div");

    overlay.style.position = "absolute";
    overlay.style.top = container.offsetTop + container.clientTop + "px";
    overlay.style.left = container.offsetLeft + container.clientLeft + "px";
    overlay.style.width = container.clientWidth + "px";
    overlay.style.height = container.clientHeight + "px";

    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "10";

    // ---- GRID SIZE LABEL ----
    const gridLabel = document.createElement("div");
    gridLabel.style.position = "absolute";
    gridLabel.style.padding = "4px 8px";
    gridLabel.style.background = "rgba(0,0,0,0.6)";
    gridLabel.style.color = "#fff";
    gridLabel.style.fontFamily = "monospace";
    gridLabel.style.fontSize = "var(--font-size-lg)";
    gridLabel.style.borderRadius = "4px";
    gridLabel.style.width = "max-content";

    overlay.appendChild(gridLabel);

    this.gridLabel = gridLabel;
    this.overlay = overlay;

    return overlay;
  }

  onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // const referenceWidth = 300; // "desktop baseline"
    // const scale = width / referenceWidth;
    //const frustumSize = scale * width;

    const frustumSize = 5;

    if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = (-frustumSize * aspect) / 2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height);

    const rect = this.container.getBoundingClientRect();
    this.overlay.style.position = "absolute";
    this.overlay.style.top = rect.top + "px";
    this.overlay.style.left = rect.left + "px";
  };

  update() {
    if (this.controller instanceof OrbitControls) {
      this.controller.update();
      this.render();
    }
    this.camera.updateProjectionMatrix();
  }

  updateOverlay(step: number) {
    this.gridLabel.innerText = `Grid: ${step.toFixed(0)} mm\n`;
    // `Zoom: ${this.camera.zoom.toFixed(2)}\n` +
    // `Center: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)})`;
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.controller.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.overlay);

    // Remove canvas from DOM safely
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    window.removeEventListener("resize", this.onResize);
  }

  getWorldPosition(event: MouseEvent): THREE.Vector3 {
    const rect = this.dom.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection;
  }

  setCameraMode(mode: CameraMode) {
    //if (this.mode === mode) return;

    this.mode = mode;

    if (mode === "2D") {
      this.camera = this.orthoCamera;
    } else {
      //this.perspectiveCamera.position.copy(this.orthoCamera.position);

      this.camera = this.perspectiveCamera;
      this.renderer.render(this.scene, this.camera);
    }

    // Smooth transition
    //this.camera.position.copy(prevCamera.position);

    // Dispose old controller
    if (this.controller) {
      this.controller.dispose();
    }

    // Create correct controller
    if (mode === "2D") {
      this.controller = new CameraController(this.orthoCamera, this.dom, this);
    } else {
      const controls = new OrbitControls(this.perspectiveCamera, this.dom);
      controls.enableDamping = true;
      controls.target.set(0, 0, 0);
      this.controller = controls;
      this.update();
    }

    this.onResize();
  }

  setPanEnabled(enabled: boolean) {
    if (this.controller instanceof CameraController) {
      this.controller.setPanEnabled(enabled); // needed for damping
    }
  }
}
