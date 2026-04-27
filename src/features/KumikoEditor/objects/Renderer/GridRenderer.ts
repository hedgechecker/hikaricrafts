import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";
import type { Settings } from "../../models/Settings";

interface GridRenderData extends RenderData {
  mesh: THREE.Group;
  divisions: number;
}

export class GridRenderer extends BaseRenderer<GridRenderData, Settings> {
  private hoveredPoint: THREE.Vector3 | null = null;
  constructor(sceneManager: SceneManager) {
    super(sceneManager);
  }

  protected getId() {
    return "grid";
  }
  public addFromData(settings: Settings) {
    this.createGrid(settings);
  }
  protected updateFromData(settings: Settings) {
    const grid = this.objects.get("grid");
    if (!grid) return;

    this.sceneManager.scene.remove(grid.mesh);

    this.createGrid(settings);
  }

  update() {}

  private createGrid(settings: Settings) {
    settings;
  }

  snapToGrid(worldPos: THREE.Vector3) {
    if (!this.visible) return null;
    const step = 1;

    const snappedX = Math.round(worldPos.x / step) * step;
    const snappedY = Math.round(worldPos.y / step) * step;

    const pointIntersect = new THREE.Vector3(snappedX, snappedY, 0);
    const pointXLine = new THREE.Vector3(snappedX, worldPos.y, 0);
    const pointYLine = new THREE.Vector3(worldPos.x, snappedY, 0);

    let minDist = Infinity;
    let closestPoint: THREE.Vector3 | null = null;

    const dist = worldPos.distanceTo(pointIntersect);
    if (dist < step / 6) {
      return pointIntersect;
    }

    if (worldPos.distanceTo(pointXLine) < worldPos.distanceTo(pointYLine)) {
      closestPoint = pointXLine;
      minDist = worldPos.distanceTo(pointXLine);
    } else {
      closestPoint = pointYLine;
      minDist = worldPos.distanceTo(pointYLine);
    }

    if (minDist < step / 6) {
      return closestPoint;
    }

    return null;
  }

  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);

    const snapped = this.snapToGrid(worldPos);
    this.hoveredPoint = snapped;

    return snapped !== null;
  }

  getHoveredPoint() {
    return this.hoveredPoint;
  }
}
