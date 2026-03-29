import * as THREE from 'three';
import type { SceneManager } from '../SceneManager';

export interface RenderData {
  mesh: THREE.Object3D;
  isHovered: boolean;
  isSelected: boolean;
  isInValid: boolean;
}

export abstract class BaseRenderer<T extends RenderData, TInput> {
  protected sceneManager: SceneManager;
  protected objects = new Map<string, T>();

  protected hovered: string | null = null;
  protected selected: string[] = [];
  protected invalid: string[] = [];

  protected zoom = 1;
  protected visible = true;

  protected colorInValid = "#ff0000";
  

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  abstract updateScale(zoom: number): void;
  protected abstract getId(data: TInput): string;
  protected abstract addFromData(data: TInput): void;
  protected abstract updateFromData(data: TInput): void;

  has(id: string) {
    return this.objects.has(id);
  }

  getAllIds(): string[] {
    return [...this.objects.keys()];
  }

  getHitboxes(): THREE.Object3D[] {
    let arr: THREE.Object3D<THREE.Object3DEventMap>[] = [];
    this.objects.forEach((object) => {
      arr.push(object.mesh.getObjectByName('hitbox')!);
    });
    return arr;
  }
  getHovered() {
    return this.hovered;
  }
  getSelected() {
    return this.selected;
  }

  setHovered(id: string | null) {
    if (this.hovered) {
      const obj = this.objects.get(this.hovered);
      if (obj) obj.isHovered = false;
    }

    this.hovered = id;

    if (this.hovered) {
      const obj = this.objects.get(this.hovered);
      if (obj) obj.isHovered = true;
    }

    this.updateScale(this.zoom);
  }

  setSelected(ids: string[]) {
    this.selected.forEach((id) => {
      const obj = this.objects.get(id);
      if (obj) obj.isSelected = false;
    });

    this.selected = ids;

    this.selected.forEach((id) => {
      const obj = this.objects.get(id);
      if (obj) obj.isSelected = true;
    });
  }

  setInvalid(ids: string[]) {
    this.invalid.forEach((id) => {
      const obj = this.objects.get(id);
      if (obj) obj.isInValid = false;
    });

    this.invalid = ids;

    this.invalid.forEach((id) => {
      const obj = this.objects.get(id);
      if (obj) obj.isInValid = true;
    });
    this.updateScale(this.zoom);
  }

  remove(id: string) {
    const obj = this.objects.get(id);
    if (!obj) return;

    this.sceneManager.scene.remove(obj.mesh);

    obj.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.objects.delete(id);
  }

  getVisible(){
    return this.visible;
  }

  setVisible(visible: boolean) {
    if (visible === this.visible) return;
    this.objects.forEach((obj) => {
      if (visible) {
        this.sceneManager.scene.add(obj.mesh);
      } else {
        this.sceneManager.scene.remove(obj.mesh);
      }
    });

    this.visible = visible;
  }

  sync(data: TInput[]) {
    const existing = new Set(this.objects.keys());

    for (const item of data) {
      const id = this.getId(item);
      if (!this.has(id)) {
        this.addFromData(item);
      } else {
        this.updateFromData(item);
      }
      existing.delete(id);
    }

    for (const id of existing) {
      this.remove(id);
    }
  }

  clear() {
    this.objects.forEach((obj) => {
      this.sceneManager.scene.remove(obj.mesh);
    });

    this.objects.clear();
  }
}
