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

  protected updateFromData(data: PatternData) {
    const absPos = getScenePos(data.pos, this.sceneManager.settings);
    this.setPosition(data.id, new THREE.Vector3(absPos.x, absPos.y, absPos.z));
  }

  update() {
  }

  setPosition(id: string, pos: THREE.Vector3) {
    const p = this.objects.get(id);
    if (!p) return;
    p.mesh.position.copy(pos);
    this.sceneManager.render();
  }

  getWorldPosition(id: string): THREE.Vector3 | null {
    return this.objects.get(id)?.mesh.position ?? null;
  }
  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);
    let hoveredPointId = null;
    const thres = 0.1 / this.zoom;

    for (const object of this.objects) {
      const pos = object[1].mesh.position;
      if (
        Math.pow(pos.x - worldPos.x, 2) + Math.pow(pos.y - worldPos.y, 2) <
          thres &&
        (this.selected.length != 1 ||
          !this.selected.some((point) => point == object[0]))
      ) {
        hoveredPointId = object[0];
        this.setHovered(hoveredPointId);
        return true;
      }
    }
    return false;
  }
}
