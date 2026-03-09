import * as THREE from 'three';

export class BackgroundImage {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;

  private imageMesh?: THREE.Mesh;
  private handle?: THREE.Mesh;
  private visible: boolean = true;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private dragging = false;

  private aspect = 1;
  private height = 10;

  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5);

  constructor(scene: THREE.Scene, camera: THREE.Camera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    domElement.addEventListener('mousedown', this.onMouseDown);
    domElement.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  setBackground(url?: string) {
    if (!url) {
      this.remove();
      return;
    }

    const loader = new THREE.TextureLoader();

    loader.load(url, (texture) => {
      this.remove();

      this.aspect = texture.image.width / texture.image.height;
      this.height = 10;

      const width = this.height * this.aspect;

      const geometry = new THREE.PlaneGeometry(width, this.height);
      const material = new THREE.MeshBasicMaterial({ map: texture });

      this.imageMesh = new THREE.Mesh(geometry, material);
      this.imageMesh.position.setZ(-5);

      this.scene.add(this.imageMesh);

      this.createHandle();
    });
  }

  setVisible(visible: boolean) {
    if (visible == this.visible || !this.imageMesh || !this.handle) return;
    if (visible) {
      this.scene.add(this.imageMesh);
      this.scene.add(this.handle);
    } else {
      this.scene.remove(this.imageMesh);
      this.scene.remove(this.handle);
    }
    this.visible = visible;
  }

  private createHandle() {
    if (!this.imageMesh) return;

    const geo = new THREE.SphereGeometry(0.2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });

    this.handle = new THREE.Mesh(geo, mat);
    this.scene.add(this.handle);

    this.updateHandle();
  }

  private updateHandle() {
    if (!this.imageMesh || !this.handle) return;

    const width = this.height * this.aspect;

    this.handle.position.set(width / 2, -this.height / 2, -5);
  }

  private onMouseDown = (event: MouseEvent) => {
    if (!this.handle) return;

    this.updateMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const hit = this.raycaster.intersectObject(this.handle);

    if (hit.length > 0) {
      this.dragging = true;
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.dragging || !this.imageMesh) return;

    this.updateMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const pos = new THREE.Vector3();

    this.raycaster.ray.intersectPlane(this.dragPlane, pos);

    const newHeight = Math.abs(pos.y) * 2;

    this.height = newHeight;

    const width = this.height * this.aspect;

    this.imageMesh.geometry.dispose();
    this.imageMesh.geometry = new THREE.PlaneGeometry(width, this.height);

    this.updateHandle();
  };

  private onMouseUp = () => {
    this.dragging = false;
  };

  private updateMouse(event: MouseEvent) {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private remove() {
    if (this.imageMesh) {
      this.scene.remove(this.imageMesh);
      this.imageMesh.geometry.dispose();
      (this.imageMesh.material as THREE.Material).dispose();
      this.imageMesh = undefined;
    }

    if (this.handle) {
      this.scene.remove(this.handle);
      this.handle.geometry.dispose();
      (this.handle.material as THREE.Material).dispose();
      this.handle = undefined;
    }
  }
}
