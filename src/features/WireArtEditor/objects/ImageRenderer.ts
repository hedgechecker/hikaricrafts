import * as THREE from 'three';
import { TransformGizmo } from './TransformGizmo';
import type { ImageData } from '../models/Image';
import type { SceneManager } from './SceneManager';

export interface ImageRenderData {
  data: ImageData;
  mesh: THREE.Mesh;
  height: number;
  aspect: number;
  isHovered: boolean;
  isSelected: boolean;
}

export class ImageRenderer {
  sceneManager: SceneManager;
  private images = new Map<string, ImageRenderData>();

  private hovered: string | null = null;
  private selected: string[] = [];

  gizmo!: TransformGizmo;

  private imageVisible: boolean = true;
  private zoom: number = 1;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;

    this.gizmo = new TransformGizmo();
    this.gizmo.handles.forEach((handle) => {
      this.sceneManager.scene.add(handle);
    });
    this.gizmo.visible = false;
  }

  updateScale(zoom: number) {
    this.zoom = zoom;
    const size = 1.0 / zoom;
    this.gizmo.handles.forEach((handle) => {
      handle.children.forEach((child) => {
        child.scale.set(size, size, size);
      });
    });
  }

  getHovered() {
    return this.hovered;
  }

  getImage(id: string) {
    const img = this.images.get(id);
    if (!img) return null;
    return img.data;
  }

  getWorldPosition(id: string) {
    return { x: this.images.get(id)?.data.x, y: this.images.get(id)?.data.y };
  }

  getHitboxes(): THREE.Object3D[] {
    let arr: THREE.Object3D<THREE.Object3DEventMap>[] = [];
    this.images.forEach((image) => {
      arr.push(image.mesh);
    });
    return arr;
  }

  getFirstHoverableImage(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      const id = hit.object.userData.id;
      if (!id) continue;
      const selected = this.selected.some((image) => image == id);
      if (selected) continue;

      return id;
    }
    return null;
  }

  getHoveredHandle() {
    return this.gizmo.getHovered();
  }

  setHovered(id: string | null) {
    if (this.hovered == id) return;
    if (this.hovered) {
      this.gizmo.visible = false;
      this.gizmo.update(null);
      const image = this.images.get(this.hovered);
      if (image != undefined) {
        image.isHovered = false;
      }
    }
    this.hovered = id;

    if (this.hovered) {
      const image = this.images.get(this.hovered);
      if (image != undefined) {
        image.isHovered = true;
        this.gizmo.update(image);
      }
    }
  }

  setImageVisible(visible: boolean) {
    if (visible == this.imageVisible) return;
    this.images.forEach((image) => {
      this.imageVisible
        ? this.sceneManager.scene.remove(image.mesh)
        : this.sceneManager.scene.add(image.mesh);
    });
    this.imageVisible = visible;
    this.gizmo.visible = visible;
  }

  setData(data: ImageData) {
    const img = this.images.get(data.id);
    if (!img) return;
    img.mesh.position.set(data.x, data.y, 0);
    img.mesh.position.set(data.x, data.y, 0);
    img.height = data.height;
    img.data = {...data};

    //Set Height
    img.mesh.geometry.dispose();
    img.mesh.geometry = new THREE.PlaneGeometry(img.height * img.aspect, img.height);
    img.mesh.rotation.z = data.rotation;
  }

  setSelected(ids: string[]) {
    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const image = this.images.get(id);
        if (image != undefined) {
          //image.isSelected = false;
        }
      });
    }
    this.selected = ids;

    if (this.selected.length > 0) {
      this.selected.forEach((id) => {
        const image = this.images.get(id);
        if (image != undefined) {
          //image.isSelected = true;
        }
      });
    }
  }

  addImage(image: ImageData) {
    const loader = new THREE.TextureLoader();

    loader.load(image.url, (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(image.height * aspect, image.height);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.id = image.id;

      let data: ImageRenderData = {
        height: image.height,
        aspect: aspect,
        mesh: mesh,
        data: image,
        isHovered: false,
        isSelected: false,
      };
      this.images.set(image.id, data);
      if (this.imageVisible) this.sceneManager.scene.add(data.mesh);
      this.updateImage(image);
    });
  }

  getAllIds(): string[] {
    return Array.from(this.images.keys());
  }

  hasImage(id: string) {
    return this.images.has(id);
  }

  updateImage(data: ImageData) {
    this.setData(data);
    this.updateScale(this.zoom);

    const image = this.images.get(data.id);
    if (!image) return;
    this.gizmo.update(image);
  }

  removeImage(id: string) {
    const image = this.images.get(id);
    if (!image) return;

    this.sceneManager.scene.remove(image.mesh);
    image.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });

    this.images.delete(id);
  }

  handleHover(event: MouseEvent): boolean {
    if (!this.imageVisible) return false;
    const rect = this.sceneManager.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);

    this.gizmo.visible = true;
    const handleHits = raycaster.intersectObjects(this.gizmo.getHitboxes(), true);

    if (handleHits.length) {
      this.gizmo.setHovered(handleHits[0].object.parent?.userData.type);
      this.setHovered(this.gizmo.parent!.data.id);
      return true;
    }
    this.gizmo.setHovered("none");

    const intersects = raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredImageId = this.getFirstHoverableImage(intersects);
    if (hoveredImageId) {
      this.setHovered(hoveredImageId);
      return true;
    }

    return false;
  }
}
