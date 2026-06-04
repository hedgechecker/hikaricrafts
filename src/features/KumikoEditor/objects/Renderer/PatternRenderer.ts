import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { PatternData } from "../../models/Pattern";
import { getScenePos } from "../../utils/math";
import { createPattern } from "../../utils/patternCreation";
import { GridRenderer } from "./GridRenderer";
import { CSG } from "three-csg-ts";

interface PatternRenderData extends RenderData {
  data: PatternData;
}

export class PatternRenderer extends BaseRenderer<PatternRenderData, PatternData> {
  protected getId(data: PatternData) {
    return data.id;
  }
  public addFromData(data: PatternData, opaque?: boolean) {
    const group = createPattern(data, this.sceneManager.settings, opaque);
    const absPos = getScenePos(data.pos, this.sceneManager.settings);
    group.position.copy(absPos);
    group.rotation.z = (Math.PI / 3) * data.pos.rotation;
    group.updateMatrix();

    group.userData.id = data.id;
    group.visible = this.visible;

    const cuttingTool = GridRenderer.createPanelFrame({
      width: this.sceneManager.settings.width + 20000,
      height: this.sceneManager.settings.height + 20000,
      depth: 200,
      frameWidth: this.sceneManager.settings.frameWidth + 10000,
      lineWidth: 0,
      spacing: 0,
    });
    cuttingTool.updateMatrixWorld(true);
    group.updateMatrixWorld(true);
    let resultGroup = new THREE.Group();
    group.traverse((child) => {
      child.position.copy(group.position);
      child.rotation.copy(group.rotation);
      if (child.name == "hitbox") {
        resultGroup.add(child.clone());
      } else if (child instanceof THREE.Mesh) {
        child.updateMatrixWorld(true);
        const cutMesh = CSG.subtract(child, cuttingTool);
        resultGroup.add(cutMesh);
      }
    });
    resultGroup.userData.id = data.id;

    this.sceneManager.scene.add(resultGroup);

    this.objects.set(data.id, {
      mesh: resultGroup,
      isSelected: opaque ? opaque : false,
      isHovered: false,
      isInValid: false,
      data: data,
    });
    if (opaque) {
      this.selected.push(data.id);
    }
  }

  clearPreview() {
    if (this.selected.length > 0) {
      this.selected.forEach((select) => {
        const mesh = this.objects.get(select);
        if (mesh) this.sceneManager.scene.remove(mesh.mesh);
      });
    }
    this.selected = [];
    this.sceneManager.render();
  }

  updateFromData(data: PatternData) {
    const prev = this.objects.get(data.id);

    if(prev){
      const needsUpdate =
        data.patternType != prev.data.patternType ||
        data.pos.x != prev.data.pos.x ||
        data.pos.y != prev.data.pos.y ||
        data.pos.z != prev.data.pos.z ||
        data.pos.rotation != prev.data.pos.rotation ||
        data.materialMap != prev.data.materialMap;
      ;
      if(!needsUpdate) {
        return;}
      if (prev) this.sceneManager.scene.remove(prev.mesh);
    }
    
    this.addFromData(data);
  }

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
    this.sceneManager.camera.updateMatrix();
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const intersects = this.raycaster.intersectObjects(
      this.getHitboxes(),
      false,
    );
    const hoveredPattern = this.getFirstHoverable(intersects);
    if (hoveredPattern) {
      this.setHovered(hoveredPattern);
      return true;
    }
    return false;
  }
}
