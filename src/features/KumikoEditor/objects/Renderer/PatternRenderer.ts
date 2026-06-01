import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { PatternData } from "../../models/Pattern";
import { getScenePos } from "../../utils/math";
import { createPattern } from "../../utils/patternCreation";

export class PatternRenderer extends BaseRenderer<RenderData, PatternData> {
  protected getId(data: PatternData) {
    return data.id;
  }
  public addFromData(data: PatternData) {
    const group = createPattern(data, this.sceneManager.settings, false);
    const absPos = getScenePos(data.pos, this.sceneManager.settings);
    group.position.copy(absPos);
    group.rotation.z = (Math.PI / 3) * data.pos.rotation;
    group.updateMatrix();

    group.userData.id = data.id;
    group.visible = this.visible;
    this.sceneManager.scene.add(group);

    this.objects.set(data.id, {
      mesh: group,
      isSelected: false,
      isHovered: false,
      isInValid: false,
    });
    this.sceneManager.render();
    return group;
  }

  updateFromData(data: PatternData) {
    const group = createPattern(data, this.sceneManager.settings, false);
    const absPos = getScenePos(data.pos, this.sceneManager.settings);
    group.position.copy(absPos);
    group.rotation.z = (Math.PI / 3) * data.pos.rotation;
    group.updateMatrix();

    group.userData.id = data.id;
    group.visible = this.visible;

    const prev = this.objects.get(data.id);
    if(prev) this.sceneManager.scene.remove(prev.mesh);
    this.sceneManager.scene.add(group);

    this.objects.set(data.id, {
      mesh: group,
      isSelected: false,
      isHovered: false,
      isInValid: false,
    });
    this.sceneManager.render();
    return group;
  }

  update() {}

  getFirstHoverable(intersects: THREE.Intersection[]): string | null {
      for (const hit of intersects) {
        const id = hit.object.parent?.userData.id;
        if (!id) continue;
        return id;
      }
      return null;
    }

  getWorldPosition(id: string): THREE.Vector3 | null {
    return this.objects.get(id)?.mesh.position ?? null;
  }
  handleHover(event: MouseEvent): boolean {
    const rect = this.sceneManager.dom.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    
    const intersects = this.raycaster.intersectObjects(
      this.getHitboxes(),
      false,
    );
    const hoveredLine = this.getFirstHoverable(intersects);
    if (hoveredLine) {
      this.setHovered(hoveredLine);
      return true;
    }
    return false;
  }
}
