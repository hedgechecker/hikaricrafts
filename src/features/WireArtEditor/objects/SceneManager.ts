import * as THREE from "three";
import { CameraController } from "./CameraController";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  scene: THREE.Scene;
  controller!: CameraController | OrbitControls;
  renderer: THREE.WebGLRenderer;
  dom: HTMLCanvasElement;
  container: HTMLDivElement;

  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;
  private perspectiveCamera: THREE.PerspectiveCamera;

  private animationId?: number;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private mouse = new THREE.Vector2(0, 0);

  private count = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.addLighting();

    const aspect = width / height;
    const frustumSize = 10;

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
    this.camera = this.orthoCamera;
    this.setCameraMode("2D");

    window.addEventListener("resize", this.onResize);
    this.renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault(),
    );

    setInterval(() => {
      //logInfo("renders/sec:", this.count);
      this.count = 0;
      this.render();
    }, 1000);
  }

  addLighting() {
    this.scene.background = new THREE.Color(0xfaf7f2);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const light = new THREE.SpotLight(0xffffff, 150, 100, Math.PI / 3, 0, 1);
    light.position.set(0, 0, 50);
    light.lookAt(0, 0, 0);
    this.scene.add(light);
  }

  render() {
    this.count++;
    this.renderer.render(this.scene, this.camera);
  }

  onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    // const referenceWidth = 300; // "desktop baseline"
    // const scale = width / referenceWidth;
    //const frustumSize = scale * width;

    const frustumSize = 7;

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
  };

  update() {
    if (this.controller instanceof OrbitControls) {
      this.controller.update();
      this.render();
    }
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.controller.dispose();
    this.renderer.dispose();

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

  setCameraMode(mode: "2D" | "3D") {
    if (mode === "2D") {
      this.camera = this.orthoCamera;
    } else {
      this.camera = this.perspectiveCamera;
      this.renderer.render(this.scene, this.camera);
    }
    //this.camera.position.copy(prevCamera.position);

    if (this.controller) {
      this.controller.dispose();
    }

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
      this.controller.setPanEnabled(enabled);
    }
  }
}
