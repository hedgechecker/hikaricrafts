import * as THREE from 'three';

export class CameraController {
  private camera: THREE.OrthographicCamera;
  private domElement: HTMLElement;

  private isPanning = false;
  private panEnabled = true;
  private lastMouse = new THREE.Vector2();

  private lastTouchDistance = 0;

  constructor(camera: THREE.OrthographicCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    domElement.addEventListener('wheel', this.onWheel, { passive: false });
    domElement.addEventListener('mousedown', this.onMouseDown);
    domElement.addEventListener('mousemove', this.onMouseMove);
    domElement.addEventListener('mouseup', this.onMouseUp);

    domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd);
  }

  // =======================
  // ZOOM TO CURSOR (DESKTOP)
  // =======================

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();

    const rect = this.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    this.zoomToPoint(mouse, event.deltaY > 0 ? 0.9 : 1.1);
  };

  // =======================
  // TOUCH HANDLING
  // =======================

  private onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      this.isPanning = true;
      this.lastMouse.set(t.clientX, t.clientY);
    }

    if (event.touches.length === 2) {
      this.isPanning = false;
      this.lastTouchDistance = this.getTouchDistance(event);
    }
  };

  private onTouchMove = (event: TouchEvent) => {
    event.preventDefault();

    if (this.panEnabled && event.touches.length === 1 && this.isPanning) {
      const t = event.touches[0];

      const dx = t.clientX - this.lastMouse.x;
      const dy = t.clientY - this.lastMouse.y;

      const rect = this.domElement.getBoundingClientRect();

      const worldWidth = (this.camera.right - this.camera.left) / this.camera.zoom;
      const worldHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;

      const moveX = (dx / rect.width) * worldWidth;
      const moveY = (dy / rect.height) * worldHeight;

      this.camera.position.x -= moveX;
      this.camera.position.y += moveY;
      this.lastMouse.set(t.clientX, t.clientY);
    }

    if (event.touches.length === 2) {
      const newDistance = this.getTouchDistance(event);
      const center = this.getTouchCenter(event);

      const zoomFactor = newDistance / this.lastTouchDistance;

      const rect = this.domElement.getBoundingClientRect();

      const mouse = new THREE.Vector2(
        ((center.x - rect.left) / rect.width) * 2 - 1,
        -((center.y - rect.top) / rect.height) * 2 + 1,
      );

      this.zoomToPoint(mouse, zoomFactor);

      this.lastTouchDistance = newDistance;
    }
  };

  private onTouchEnd = () => {
    this.isPanning = false;
  };

  // =======================
  // SHARED ZOOM LOGIC
  // =======================

  private zoomToPoint(mouse: THREE.Vector2, factor: number) {
    const beforeZoom = this.screenToWorld(mouse);

    this.camera.zoom *= factor;
    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom, 0.05, 10);
    this.camera.updateProjectionMatrix();

    const afterZoom = this.screenToWorld(mouse);

    const offset = beforeZoom.sub(afterZoom);
    this.camera.position.add(offset);
  }

  private screenToWorld(mouse: THREE.Vector2) {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
    vector.unproject(this.camera);
    return vector;
  }

  // =======================
  // MOUSE PAN
  // =======================

  private onMouseDown = (event: MouseEvent) => {
    if (event.button === 0) return;
    if (event.button == 1) event.preventDefault();

    this.isPanning = true;
    this.lastMouse.set(event.clientX, event.clientY);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isPanning || !this.panEnabled) return;
    const dx = event.clientX - this.lastMouse.x;
    const dy = event.clientY - this.lastMouse.y;

    const rect = this.domElement.getBoundingClientRect();

    const worldWidth = (this.camera.right - this.camera.left) / this.camera.zoom;
    const worldHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;

    const moveX = (dx / rect.width) * worldWidth;
    const moveY = (dy / rect.height) * worldHeight;

    this.camera.position.x -= moveX;
    this.camera.position.y += moveY;

    this.lastMouse.set(event.clientX, event.clientY);
  };

  private onMouseUp = () => {
    this.isPanning = false;
  };

  // =======================
  // HELPERS
  // =======================

  private getTouchDistance(event: TouchEvent) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchCenter(event: TouchEvent) {
    return new THREE.Vector2(
      (event.touches[0].clientX + event.touches[1].clientX) / 2,
      (event.touches[0].clientY + event.touches[1].clientY) / 2,
    );
  }

  // =======================

  dispose() {
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }

  setPanEnabled(enabled: boolean) {
    this.panEnabled = enabled;
  }
}
