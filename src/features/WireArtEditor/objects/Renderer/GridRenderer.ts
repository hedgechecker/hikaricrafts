import * as THREE from 'three';
import { BaseRenderer, type RenderData } from './BaseRenderer';
import type { SceneManager } from '../SceneManager';

interface GridRenderData extends RenderData {
  mesh: THREE.LineSegments;
  divisions: number;
}

export class GridRenderer extends BaseRenderer<GridRenderData, number> {
  private size = 200;
  private hoveredGrid: THREE.Vector3 | null = null;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);

    const divisions = this.getSubdivisionDivisions();
    this.createGrid(divisions);
  }

  /* ---------------- BaseRenderer hooks ---------------- */

  protected getId() {
    return 'grid';
  }
  protected addFromData(divisions: number) {
    this.createGrid(divisions);
  }
  protected updateFromData(divisions: number) {
    const grid = this.objects.get('grid');
    if (!grid) return;

    if (grid.divisions === divisions) return;

    this.sceneManager.scene.remove(grid.mesh);

    grid.mesh.geometry.dispose();
    //grid.mesh.material.dispose();

    this.createGrid(divisions);
  }
  updateScale(zoom: number) {
    this.zoom = zoom;
    this.update();
  }

  /* ---------------- Grid Logic ---------------- */

  update() {
    const divisions = this.getSubdivisionDivisions();
    this.sceneManager.updateOverlay(this.getGridStep()*10);
    this.sync([divisions]);
  }

  private createGrid(divisions: number) {
    const mesh = this.createCustomGrid(divisions);

    const data: GridRenderData = {
      mesh,
      divisions,
      isHovered: false,
      isSelected: false,
      isInValid: false
    };

    this.objects.set('grid', data);

    this.sceneManager.scene.add(mesh);
  }

  private createCustomGrid(divisions: number) {
    const halfSize = this.size / 2;
    const step = this.size / divisions;

    const vertices: number[] = [];
    const colors: number[] = [];

    const colorMinor = new THREE.Color(0x888888);
    const colorMajor = new THREE.Color(0x222222);
    const colorXCenter = new THREE.Color(0xaa0000);
    const colorYCenter = new THREE.Color(0x00aa00);

    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      const isMajor = i % 5 === 0;

      const color = isMajor ? colorMajor : colorMinor;

      let colorLineX = color.clone();
      if (pos === 0) colorLineX = colorXCenter.clone();

      vertices.push(-halfSize, pos, 0, halfSize, pos, 0);
      colors.push(colorLineX.r, colorLineX.g, colorLineX.b);
      colors.push(colorLineX.r, colorLineX.g, colorLineX.b);

      let colorLineY = color.clone();
      if (pos === 0) colorLineY = colorYCenter.clone();

      vertices.push(pos, -halfSize, 0, pos, halfSize, 0);
      colors.push(colorLineY.r, colorLineY.g, colorLineY.b);
      colors.push(colorLineY.r, colorLineY.g, colorLineY.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
    });

    return new THREE.LineSegments(geometry, material);
  }

  /* ---------------- Grid Utility ---------------- */

  getSubdivisionDivisions() {

    let cameraZoom = 10;
    if(this.sceneManager.camera instanceof THREE.OrthographicCamera){
      cameraZoom = this.sceneManager.camera.zoom;
    }
    if (cameraZoom > 5) return 2000;
    if (cameraZoom > 1.6) return 400;
    if (cameraZoom > 0.8) return 200;
    if (cameraZoom > 0.2) return 80;
    if (cameraZoom > 0.1) return 40;

    return 20;
  }

  getGridStep(): number {
    const divisions = this.getSubdivisionDivisions();

    return this.size / divisions;
  }

  snapToGrid(worldPos: THREE.Vector3) {
    const step = this.getGridStep();

    const snappedX = Math.round(worldPos.x / step) * step;
    const snappedY = Math.round(worldPos.y / step) * step;

    const point = new THREE.Vector3(snappedX, snappedY, 0);

    if (worldPos.distanceTo(point) < step / 6) {
      return point;
    }

    return null;
  }

  /* ---------------- Hover ---------------- */

  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);

    const snapped = this.snapToGrid(worldPos);

    this.hoveredGrid = snapped;

    return snapped !== null;
  }

  getHoveredGrid() {
    return this.hoveredGrid;
  }
}
