import * as THREE from 'three';
import { TransformGizmo } from '../TransformGizmo';
import type { ImageData } from '../../models/Image';
import type { SceneManager } from '../SceneManager';
import { BaseRenderer, type RenderData } from './BaseRenderer';

export interface ImageRenderData extends RenderData {
  data: ImageData;
  height: number;
  aspect: number;
}

export class ImageRenderer extends BaseRenderer<ImageRenderData, ImageData> {
  gizmo!: TransformGizmo;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);

    this.gizmo = new TransformGizmo();

    this.gizmo.handles.forEach((handle) => {
      this.sceneManager.scene.add(handle);
      handle.visible = false;
    });

    this.gizmo.setVisible(false);
  }

  protected getId(data: ImageData) {
    return data.id;
  }
  protected addFromData(data: ImageData) {
    this.addImage(data);
  }
  protected updateFromData(data: ImageData) {
    this.updateImage(data);
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

  getFirstHoverableImage(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
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
      this.gizmo.setVisible(false);
      this.gizmo.update(null);
      const image = this.objects.get(this.hovered);
      if (image) {
        image.isHovered = false;
      }
    }
    this.hovered = id;

    if (this.hovered) {
      const image = this.objects.get(this.hovered);
      if (image) {
        image.isHovered = true;
        this.gizmo.setVisible(true);
        this.gizmo.update(image);
      }
    }
  }

  setVisible(visible: boolean) {
    super.setVisible(visible);
    this.gizmo.setVisible(visible);
  }

  addImage(image: ImageData) {
    const loader = new THREE.TextureLoader();

    loader.load(image.url, (texture) => {
      const group = new THREE.Group();

      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(image.height * aspect, image.height);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = 'visual';

      const hitGeometry = new THREE.PlaneGeometry(image.height * aspect, image.height);
      const hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0, // invisible
        depthWrite: false,
      });

      const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
      hitbox.name = 'hitbox';

      group.add(mesh);
      group.add(hitbox);
      group.userData.id = image.id;

      let data: ImageRenderData = {
        height: image.height,
        aspect: aspect,
        mesh: group,
        data: image,
        isHovered: false,
        isSelected: false,
        isInValid: false
      };
      this.objects.set(image.id, data);
      if (this.visible) this.sceneManager.scene.add(data.mesh);
      this.updateImage(image);
    });
  }

  updateImage(data: ImageData) {
    const img = this.objects.get(data.id);
    if (!img) return;
    img.mesh.position.set(data.x, data.y, 0);
    img.mesh.position.set(data.x, data.y, 0);
    img.height = data.height;
    img.data = { ...data };

    img.mesh.children.forEach((child) => {
      if (child.name == 'visual' && child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.geometry = new THREE.PlaneGeometry(img.height * img.aspect, img.height);
      }
    });
    //Set Height
    img.mesh.rotation.z = data.rotation;

    this.updateScale(this.zoom);

    const image = this.objects.get(data.id);
    if (!image) return;
    this.gizmo.update(image);
  }

  handleHover(event: MouseEvent): boolean {
    if (!this.visible || this.objects.size < 1) return false;
    const rect = this.sceneManager.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);


    const handleHits = raycaster.intersectObjects(this.gizmo.getHitboxes(), true);

    if (handleHits.length) {
      this.gizmo.setVisible(true);
      this.gizmo.setHovered(handleHits[0].object.parent?.userData.type);
      this.setHovered(this.gizmo.parent!.data.id);
      return true;
    }
    this.gizmo.setHovered(null);

    const intersects = raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredImageId = this.getFirstHoverableImage(intersects);
    if (hoveredImageId) {
      this.gizmo.setVisible(true);
      this.setHovered(hoveredImageId);
      return true;
    }

    return false;
  }
}
