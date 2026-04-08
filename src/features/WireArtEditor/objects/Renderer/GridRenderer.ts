import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";

interface GridRenderData extends RenderData {
  mesh: THREE.LineSegments;
  divisions: number;
}

export class GridRenderer extends BaseRenderer<GridRenderData, number> {
  private size = 200;
  private hoveredGrid: THREE.Vector3 | null = null;
  private gridLabel!: HTMLDivElement;
  private overlay!: HTMLDivElement;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);

    const divisions = this.getSubdivisionDivisions();
    this.createGrid(divisions);
    sceneManager.container.appendChild(this.createOverlay(sceneManager.container));
    this.update(this.zoom);
  }

  protected getId() {
    return "grid";
  }
  public addFromData(divisions: number) {
    this.createGrid(divisions);
  }
  protected updateFromData(divisions: number) {
    const grid = this.objects.get("grid");
    if (!grid) return;

    if (grid.divisions === divisions) return;
    this.sceneManager.scene.remove(grid.mesh);

    grid.mesh.geometry.dispose();

    this.createGrid(divisions);
  }

  update(zoom: number) {
    this.zoom = zoom;
    const divisions = this.getSubdivisionDivisions();

    this.gridLabel.innerText = `Gittergröße: ${(this.getGridStep() * 10).toFixed(0)} mm\n`;
    this.overlay.style.position = "absolute";
    const rect = this.sceneManager.dom.getBoundingClientRect(); 
    this.overlay.style.top = rect.top + "px";
    this.overlay.style.left = rect.left + "px";
    this.sync([divisions]);
  }

  private createGrid(divisions: number) {
    const mesh = this.createCustomGrid(divisions);

    const data: GridRenderData = {
      mesh,
      divisions,
      isHovered: false,
      isSelected: false,
      isInValid: false,
    };

    this.objects.set("grid", data);

    data.mesh.visible = this.visible;
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
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
    });

    return new THREE.LineSegments(geometry, material);
  }

  createOverlay(container: HTMLDivElement) {
    const overlay = document.createElement("div");

    overlay.style.position = "absolute";
    overlay.style.top = container.offsetTop + container.clientTop + "px";
    overlay.style.left = container.offsetLeft + container.clientLeft + "px";
    overlay.style.width = container.clientWidth + "px";
    overlay.style.height = container.clientHeight + "px";

    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "10";

    // ---- GRID SIZE LABEL ----
    const gridLabel = document.createElement("div");
    gridLabel.style.position = "absolute";
    gridLabel.style.padding = "4px 8px";
    gridLabel.style.background = "rgba(0,0,0,0.6)";
    gridLabel.style.color = "#fff";
    gridLabel.style.fontFamily = "monospace";
    gridLabel.style.fontSize = "var(--font-size-lg)";
    gridLabel.style.borderRadius = "4px";
    gridLabel.style.width = "max-content";

    overlay.appendChild(gridLabel);

    this.gridLabel = gridLabel;
    this.overlay = overlay;

    return overlay;
  }

  setVisible(visible: boolean): void {
    super.setVisible(visible);
    this.gridLabel.style.display = visible? "block" : "none";
    this.update(this.zoom);
  }

  getSubdivisionDivisions() {
    if (this.zoom > 5) return 2000;
    if (this.zoom > 1.6) return 400;
    if (this.zoom > 0.8) return 200;
    if (this.zoom > 0.2) return 80;
    if (this.zoom > 0.1) return 40;

    return 20;
  }

  getGridStep(): number {
    const divisions = this.getSubdivisionDivisions();

    return this.size / divisions;
  }

  snapToGrid(worldPos: THREE.Vector3) {
    if (!this.visible) return null;
    const step = this.getGridStep();

    const snappedX = Math.round(worldPos.x / step) * step;
    const snappedY = Math.round(worldPos.y / step) * step;

    const point = new THREE.Vector3(snappedX, snappedY, 0);

    if (worldPos.distanceTo(point) < step / 6) {
      return point;
    }

    return null;
  }

  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);

    const snapped = this.snapToGrid(worldPos);
    this.hoveredGrid = snapped;

    return snapped !== null;
  }

  getHoveredGrid() {
    return this.hoveredGrid;
  }

  dispose(){
    this.sceneManager.container.removeChild(this.overlay);
  }
}
