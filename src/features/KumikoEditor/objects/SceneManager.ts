import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Settings } from "../models/Settings";

export class SceneManager {
  scene: THREE.Scene;
  controller!: OrbitControls;
  renderer: THREE.WebGLRenderer;
  dom: HTMLCanvasElement;
  container: HTMLDivElement;
  settings: Settings;

  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;
  private perspectiveCamera: THREE.PerspectiveCamera;

  private intervalId: any | null = null;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private mouse = new THREE.Vector2(0, 0);

  private count = 0;
  private start = Date.now();

  constructor(container: HTMLDivElement, settings: Settings) {
    this.container = container;
    this.settings = settings;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.start = Date.now();

    this.scene = new THREE.Scene();
    this.addLighting(new THREE.Sphere());

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
    this.perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
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

    this.onResize();
    this.setCameraMode("2D");

    window.addEventListener("resize", this.onResize);
    this.renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault(),
    );

    this.intervalId = setInterval(() => {
      //logInfo("renders/sec:", this.count);
      this.count = 0;
      this.render();
    }, 1000);
  }

  addLighting(sphere: THREE.Sphere) {
    this.scene.background = new THREE.Color(0xfaf7f2);
    //shines light from the front
    const light = new THREE.DirectionalLight(0xfdf3c6, 1);
    light.position.set(
      sphere.center.x,
      sphere.center.y,
      sphere.center.z + sphere.radius,
    );
    light.target.position.copy(sphere.center);
    this.scene.add(light);

    //shines light from the back
    const light2 = new THREE.DirectionalLight(0xfdf3c6, 1);
    light2.position.set(
      sphere.center.x,
      sphere.center.y,
      sphere.center.z - sphere.radius,
    );
    light2.target.position.copy(sphere.center);
    this.scene.add(light2);

    //overall ligthing
    this.scene.add(new THREE.AmbientLight(0xfdf3c6, 2));
  }

  render() {
    if(Date.now() - this.start < 700) { return;}
    this.count++;
    this.renderer.render(this.scene, this.camera);
  }

  onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
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
    this.update();
  };

  update() {
    if (this.controller instanceof OrbitControls) {
      this.controller.update();
    }
    this.camera.updateProjectionMatrix();
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

    if (this.controller) {
      this.controller.dispose();
    }

    const controls = new OrbitControls(this.camera, this.dom);

    if (mode === "2D") {
      this.camera.position.set(0, 0, 100);
      this.camera.zoom = 0.01;
      this.camera.lookAt(0, 0, 0);
      controls.enableRotate = false;
    } else {
      this.camera.position.set(0, 0, 100);
      this.camera.zoom = 0.5;
      controls.enableRotate = true;
      controls.enableDamping = true;
      controls.panSpeed = 2;
    }
    controls.enableZoom = true;
    controls.zoomSpeed = 5;
    controls.target.set(0, 0, 0);
    controls.update();

    this.controller = controls;

    const minPan = new THREE.Vector3(
      -this.settings.width / 2,
      -this.settings.height / 2,
      -10,
    );
    const maxPan = new THREE.Vector3(
      this.settings.width / 2,
      this.settings.height / 2,
      10,
    );

    const dist = Math.max(this.settings.width, this.settings.height);
    const minDistance = dist * 0.05;
    const maxDistance = dist;
    const minZoom = dist / 200000; // smaller number = zoomed out
    const maxZoom = 0.5; // larger number = zoomed in
    this.controller.addEventListener("change", () => {
      const _v = new THREE.Vector3();
      _v.copy(this.controller.target);

      // --- PAN CLAMP ---
      this.controller.target.clamp(minPan, maxPan);
      this.camera.position.add(this.controller.target.clone().sub(_v)); // keep relative offset
      // --- ZOOM CLAMP ---
      if (this.camera instanceof THREE.OrthographicCamera) {
        this.camera.zoom = THREE.MathUtils.clamp(
          this.camera.zoom,
          minZoom,
          maxZoom,
        );
        this.camera.updateProjectionMatrix();
      } else if (this.camera instanceof THREE.PerspectiveCamera) {
        const offset = new THREE.Vector3().subVectors(
          this.camera.position,
          controls.target,
        );

        const distance = offset.length();
        if (distance < minDistance) {
          offset.setLength(minDistance);
          this.camera.position.copy(controls.target).add(offset);
        } else if (distance > maxDistance) {
          offset.setLength(maxDistance);
          this.camera.position.copy(controls.target).add(offset);
        }
      }
      this.render();
      this.camera.updateProjectionMatrix();
    });

    this.onResize();
  }

  setPanEnabled(enabled: boolean) {
    this.controller.enablePan = enabled;
  }

  dispose() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.controller.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.scene.clear();

    window.removeEventListener("resize", this.onResize);
  } 
}
