import * as THREE from "three";

export class CameraController {
  private camera: THREE.OrthographicCamera;
  private domElement: HTMLElement;
  

  private isPanning = false;
  private panEnabled = true;
  private lastMouse = new THREE.Vector2();

  constructor(
    camera: THREE.OrthographicCamera,
    domElement: HTMLElement
  ) {
    this.camera = camera;
    this.domElement = domElement;
    
    domElement.addEventListener("wheel", this.onWheel, { passive: false });
    domElement.addEventListener("mousedown", this.onMouseDown);
    domElement.addEventListener("mousemove", this.onMouseMove);
    domElement.addEventListener("mouseup", this.onMouseUp);
  }

    // =======================
  // ZOOM TO CURSOR
  // =======================

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();

    const rect = this.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Convert mouse to world BEFORE zoom
    const beforeZoom = this.screenToWorld(mouse);

    const zoomFactor = 1.1;
    const direction = event.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

    this.camera.zoom *= direction;
    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom, 0.05, 10);
    this.camera.updateProjectionMatrix();

    // Convert mouse to world AFTER zoom
    const afterZoom = this.screenToWorld(mouse);

    // Move camera so point under cursor stays fixed
    const offset = beforeZoom.sub(afterZoom);
    this.camera.position.add(offset);
  };

  private screenToWorld(mouse: THREE.Vector2) {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
    vector.unproject(this.camera);
    return vector;
  }

  private onMouseDown = (event: MouseEvent) => {
    if (event.button == 0) return; // middle mouse button only

    this.isPanning = true;
    this.lastMouse.set(event.clientX, event.clientY);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isPanning || !this.panEnabled) return;

    const dx = event.clientX - this.lastMouse.x;
    const dy = event.clientY - this.lastMouse.y;

    const scale = 1 / this.camera.zoom;

    this.camera.position.x -= dx * scale * 0.02;
    this.camera.position.y += dy * scale * 0.02;

    this.lastMouse.set(event.clientX, event.clientY);

  };

  private onMouseUp = () => {
    this.isPanning = false;

  };

  dispose() {
    this.domElement.removeEventListener("wheel", this.onWheel);
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.domElement.removeEventListener("mouseup", this.onMouseUp);
  }


  setPanEnabled(enabled: boolean) {
    this.panEnabled = enabled;
  }

}
