import * as THREE from "three";
import type { ImageData } from "../../models/Image";
import { BaseRenderer, type RenderData } from "./BaseRenderer";

export interface ImageRenderData extends RenderData {
  data: ImageData;
  height: number;
  aspect: number;
}

export class ImageRenderer extends BaseRenderer<ImageRenderData, ImageData> {
  protected getId(data: ImageData) {
    return data.id;
  }
  public addFromData(image: ImageData) {
    const loader = new THREE.TextureLoader();

    loader.load(image.url, (texture) => {
      const group = new THREE.Group();

      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(
        image.height * aspect,
        image.height,
      );
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "visual";

      const hitGeometry = new THREE.PlaneGeometry(
        image.height * aspect,
        image.height,
      );
      const hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0, // invisible
        depthWrite: false,
      });

      const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
      hitbox.name = "hitbox";

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
        isInValid: false,
      };
      this.objects.set(image.id, data);
      data.mesh.visible = this.visible;
      this.sceneManager.scene.add(data.mesh);
      this.updateImage(image);
    });
    this.sceneManager.render();
  }
  protected updateFromData(data: ImageData) {
    this.updateImage(data);
  }

  update(zoom: number) {
    this.zoom = zoom;
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

  getBoundingRect(id: string) {
    const img = this.objects.get(id);
    if (!img) return;

    const pos = img.mesh.position;
    const width = img.height * img.aspect;
    const height = img.height;
    const rot = img.mesh.rotation.z;

    const hw = width / 2;
    const hh = height / 2;

    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const rotate = (x: number, y: number) => {
      return {
        x: pos.x + x * cos - y * sin,
        y: pos.y + x * sin + y * cos,
      };
    };

    return {
      topRight: rotate(hw, hh),
      bottomRight: rotate(hw, -hh),
      topLeft: rotate(-hw, hh),
      bottomLeft: rotate(-hw, -hh),
      center: { x: pos.x, y: pos.y },
    };
  }

  updateImage(data: ImageData) {
    const img = this.objects.get(data.id);
    if (!img) return;
    img.mesh.position.set(data.x, data.y, data.z);
    img.height = data.height;
    img.data = { ...data };

    img.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.geometry = new THREE.PlaneGeometry(
          img.height * img.aspect,
          img.height,
        );
      }
    });
    img.mesh.rotation.z = data.rotation;
    this.update(this.zoom);
    this.sceneManager.render();
  }

  handleHover(event: MouseEvent): boolean {
    if (!this.visible || this.objects.size < 1) return false;
    const rect = this.sceneManager.dom.getBoundingClientRect();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const intersects = this.raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredImageId = this.getFirstHoverableImage(intersects);
    this.setHovered(hoveredImageId);

    if (hoveredImageId) {
      return true;
    }

    return false;
  }
}
