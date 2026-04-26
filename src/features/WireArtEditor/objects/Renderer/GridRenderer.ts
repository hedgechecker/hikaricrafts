import * as THREE from "three";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";

interface GridRenderData extends RenderData {
  mesh: THREE.Group;
  divisions: number;
}

export class GridRenderer extends BaseRenderer<GridRenderData, number> {
  private size = 200;
  private hoveredPoint: THREE.Vector3 | null = null;

  constructor(sceneManager: SceneManager) {
    super(sceneManager);

    const divisions = this.getSubdivisionDivisions();
    this.createGrid(divisions);
    //sceneManager.container.appendChild(this.createOverlay(sceneManager.container));
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

    //grid.mesh.geometry.dispose();

    this.createGrid(divisions);
  }

  update(zoom: number) {
    this.zoom = zoom;
    const divisions = this.getSubdivisionDivisions();
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
    const group = new THREE.Group();

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

      const scale = step/5;

      if (pos == 0) {
        const label = this.createTextSprite((pos * 10).toFixed(0) + " mm");
        label.scale.set(2 * scale, scale, 1);
        label.position.set(pos + scale, scale / 4, 0); // X axis labels
        group.add(label);
        continue;
      }

      const label = this.createTextSprite((pos * 10).toFixed(0));
      label.scale.set(2 * scale, scale, 1);
      label.position.set(pos + scale, scale / 4, 0); // X axis labels
      group.add(label);

      const labelY = this.createTextSprite((pos * 10).toFixed(0));
      labelY.scale.set(2 * scale, scale, 1);
      labelY.position.set(scale, pos + scale / 4, 0); // Y axis labels
      group.add(labelY);
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
    const grid = new THREE.LineSegments(geometry, material);
    group.add(grid);
    return group;
  }

  private createTextSprite(text: string) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    const fontSize = 24;
    context.font = `${fontSize}px Arial`;

    canvas.width = fontSize * 4;
    canvas.height = fontSize * 1.2;

    context.font = `${fontSize}px Arial`;
    context.fillStyle = "black";
    context.textBaseline = "middle";
    context.fillText(text, 0, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);

    return sprite;
  }

  setVisible(visible: boolean): void {
    super.setVisible(visible);
    //  this.gridLabel.style.display = visible ? "block" : "none";
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

    const pointIntersect = new THREE.Vector3(snappedX, snappedY, 0);
    const pointXLine = new THREE.Vector3(snappedX, worldPos.y, 0);
    const pointYLine = new THREE.Vector3(worldPos.x, snappedY, 0);

    let minDist = Infinity;
    let closestPoint: THREE.Vector3 | null = null;

    const dist = worldPos.distanceTo(pointIntersect);
    if (dist < step/6) {
      return pointIntersect;
    }
    
    if(worldPos.distanceTo(pointXLine)<worldPos.distanceTo(pointYLine)){
      closestPoint = pointXLine;
      minDist = worldPos.distanceTo(pointXLine);
    }else{
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

  dispose() {
    //this.sceneManager.container.removeChild(this.overlay);
  }
}
