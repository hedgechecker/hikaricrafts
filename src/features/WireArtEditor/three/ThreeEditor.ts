import { SceneManager } from './SceneManager';
import { PointManager } from './objects/PointManager';
import { PointTool } from './tools/PointTool';
import { MoveTool } from './tools/MoveTool';
import { LineTool } from './tools/LineTool';
import { ToolManager } from './tools/ToolManager';
import type { Tool } from './tools/Tool';
import { CursorManager } from './objects/CursorManager';
import { LineManager } from './objects/LineManager';
import { DataStorage } from '../core/DataStorage';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { DataModel, type ImageData, type Project } from '../models/DataModel';
import { CommandManager } from '../core/CommandManager';
import type { Command } from '../models/Command';
import { DeletePointCommand } from '../commands/DeletePointCommand';
import { DeleteLineCommand } from '../commands/DeleteLineCommand';
import { SVGExporter } from '../core/SVGExporter';
import type { Settings } from '../models/Settings';
import { TransformTool } from './tools/TransformTool';
import { AddImageCommand } from '../commands/AddImageCommand';
import { generateId } from '../utils/id';
import { DeleteImageCommand } from '../commands/DeleteImageCommand';

export type ToolType = 'point' | 'move' | 'line';
//Import SVG?
//multiple Images?
//Scale / move Image

//check points 0/1 connections
//get all polygons
//check convex hull
//check minsize
//check minSideHeight
//check lineIntersections
export class ThreeEditor {
  private sceneManager: SceneManager;
  private pointManager: PointManager;
  private toolManager: ToolManager;
  private cursorManager: CursorManager;
  private lineManager: LineManager;
  private storage: DataStorage;

  private pointTool: PointTool;
  private moveTool: MoveTool;
  private transformTool: TransformTool;
  private lineTool: LineTool;

  private model: DataModel;
  private project: Project;
  private history: CommandManager;
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private mouse = new THREE.Vector2();
  private animationFrameId: number | null = null;
  public hasChanges = false;

  constructor(container: HTMLDivElement) {
    this.model = new DataModel();
    this.history = new CommandManager();
    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.storage = new DataStorage();
    this.project = this.storage.getEmptyProject();

    this.pointManager = new PointManager(this.sceneManager.scene);
    this.lineManager = new LineManager(this.sceneManager.scene, this.pointManager);

    this.toolManager = new ToolManager(this.sceneManager.renderer.domElement);

    this.pointTool = new PointTool(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this,
    );
    this.moveTool = new MoveTool(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.cursorManager,
      this.sceneManager.getCameraController(),
      this,
    );
    this.transformTool = new TransformTool(this.cursorManager, this, this.sceneManager);
    this.lineTool = new LineTool(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this,
    );
    this.raycaster.params.Line2 = { threshold: 2 };

    this.toolManager.setTool(this.transformTool);
    window.addEventListener('keydown', this.onKeyDown);
    this.load(this.storage.loadFromLocal());
  }

  private syncSceneFromModel() {
    this.syncPoints();
    this.syncLines();
    this.syncImages();
  }

  private syncPoints() {
    const existing = new Set(this.pointManager.getAllIds());

    for (const point of this.model.points.values()) {
      if (!this.pointManager.hasPoint(point.id)) {
        // ADD
        this.pointManager.addPoint(new Vector3(point.x, point.y, point.z), point.id);
      } else {
        // UPDATE
        this.pointManager.setPosition(point.id, new Vector3(point.x, point.y, point.z));
      }

      existing.delete(point.id);
    }

    // REMOVE deleted
    for (const id of existing) {
      this.pointManager.removePoint(id);
    }
  }

  private syncLines() {
    const existing = new Set(this.lineManager.getAllIds());

    for (const line of this.model.lines.values()) {
      if (!this.lineManager.hasLine(line.id)) {
        // ADD
        this.lineManager.addLine(line.startPointId, line.endPointId, line.id);
      } else {
        // UPDATE endpoints if needed
        this.lineManager.updateConnection(line.id, line.startPointId, line.endPointId);
      }

      existing.delete(line.id);
    }

    // REMOVE deleted
    for (const id of existing) {
      this.lineManager.removeLine(id);
    }
  }

  private syncImages() {
    const existing = new Set(this.sceneManager.getAllIds());

    for (const image of this.model.images.values()) {
      if (!this.sceneManager.hasImage(image.id)) {
        this.sceneManager.addImage(image);
      } else {
        this.sceneManager.updateImage(image);
      }
      existing.delete(image.id);
    }

    for (const id of existing) {
      this.sceneManager.removeImage(id);
    }
  }

  async loadGlobal(id: number) {
    this.load(await this.storage.loadGlobal(id));
  }

  load(data: Project | null) {
    this.model.points.clear();
    this.model.lines.clear();
    this.model.images.clear();
    this.hasChanges = false;

    if (!data) {
      const project = this.storage.getEmptyProject();
      this.setSettings(project.settings);
      this.syncSceneFromModel();
      this.storage.deleteLocal();
      this.project = project;
      return;
    }
    this.setSettings(data.settings);
    this.project = data;

    for (const point of this.project.points) {
      this.model.points.set(point.id, { ...point });
    }
    for (const line of this.project.lines) {
      this.model.lines.set(line.id, { ...line });
    }
    if (this.project.images)
      for (const image of this.project.images) {
        this.model.images.set(image.id, { ...image });
      }
    this.saveLocal();
    this.syncSceneFromModel();
  }

  public save() {
    if (!this.hasChanges) {
      return;
    }
    this.hasChanges = false;
    this.project.version = this.project.version + 1;
    this.saveLocal();
    this.saveGlobal();
  }
  private saveLocal() {
    this.storage.saveToLocal({
      ...this.project,
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
      images: Array.from(this.model.images.values()),
    });
  }

  private async saveGlobal() {
    this.storage.saveGlobal({
      ...this.project,
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
      images: Array.from(this.model.images.values()),
    });
  }

  public executeCommand(command: Command) {
    this.hasChanges = true;
    console.log(command);
    this.history.execute(command, this.model);
    this.syncSceneFromModel();
  }

  start() {
    let lastZoom = 0;
    const animate = () => {
      const { renderer, scene, camera } = this.sceneManager;
      renderer.render(scene, camera);
      if (camera.zoom != lastZoom) {
        this.pointManager.updateScale(camera.zoom);
        this.lineManager.updateScale(camera.zoom);
        this.sceneManager.update();
        lastZoom = camera.zoom;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  addBackgroundImage(url: string) {
    this.executeCommand(
      new AddImageCommand({ id: generateId(), url: url, x: 0, y: 0, rotation: 0, height: 10 }),
    );
  }

  setTool(tool: Tool | null) {
    this.toolManager.setTool(tool);
  }

  setActiveTool(type: ToolType) {
    if (type === 'point') {
      this.toolManager.setTool(this.pointTool);
    }
    if (type === 'move') {
      this.toolManager.setTool(this.moveTool);
    }
    if (type === 'line') {
      this.toolManager.setTool(this.lineTool);
    }
  }
  setHovered(id: string | null) {
    this.pointManager.setHovered(id);
  }
  setSelected(id: string[]) {
    this.pointManager.setSelected(id);
  }
  setSettings(settings: Settings) {
    if (this.project.settings) {
      const oldSettings = this.project.settings;

      (Object.keys(settings) as (keyof Settings)[]).forEach((key) => {
        if (settings[key] !== oldSettings[key]) {
          switch (key) {
            case 'showGrid':
              this.sceneManager.setGridVisible(settings.showGrid);
              break;
            case 'showImage':
              this.sceneManager.setImageVisible(settings.showImage);
              break;
            case 'showPoints':
              this.pointManager.setPointsVisible(settings.showPoints);
              break;
            case 'pointColor':
              this.pointManager.setPointColor(settings.pointColor);
              break;
            case 'lineColor':
              this.lineManager.setLineColor(settings.lineColor);
              break;
          }
        }
      });
    }
    this.project.settings = settings;
  }
  getHoveredPoint(): string | null {
    return this.pointManager.getHovered();
  }
  getHoveredLine() {
    return this.lineManager.getHovered();
  }
  getHoveredGridPoint(): THREE.Vector3 | null {
    return this.sceneManager.getHoveredGrid();
  }
  getSnapCandidates(worldPos: THREE.Vector3, threshold: number): string[] {
    return this.pointManager.getSnapCandidateIds(worldPos, threshold);
  }
  getPointWorldPosition(id: string): THREE.Vector3 | null {
    return this.pointManager.getWorldPositionById(id);
  }
  getWorldPosition(event: MouseEvent): THREE.Vector3 {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.sceneManager.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection;
  }
  public getConnectedPoints(pointId: string): string[] {
    return this.lineManager.getConnectedPoints(pointId);
  }
  getProject() {
    return this.project;
  }
  public clearHover() {
    this.pointManager.setHovered(null);
  }
  exportSVG() {
    SVGExporter.simpleExport(this.model, this.project);
  }

  private onKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'i') {
      e.preventDefault();
      this.toolManager.setTool(this.transformTool);
    }
    if (e.key === 'o') {
      e.preventDefault();
      this.toolManager.setTool(null);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();

      if (this.history.undo(this.model)) this.syncSceneFromModel();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();

      if (this.history.redo(this.model)) this.syncSceneFromModel();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();

      this.load(await this.storage.loadGlobal(1));
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const hoveredPoint = this.pointManager.getHovered();
      if (hoveredPoint) {
        this.executeCommand(new DeletePointCommand(hoveredPoint));
        this.syncSceneFromModel();
      }
      const hoveredLine = this.lineManager.getHoveredId();
      if (hoveredLine) {
        this.executeCommand(new DeleteLineCommand(hoveredLine));
        this.syncSceneFromModel();
      }
      const hoveredImage = this.sceneManager.getHoveredImage();
      if (hoveredImage) {
        this.executeCommand(new DeleteImageCommand(hoveredImage));
        this.syncSceneFromModel();
      }
    }
  };

  public previewMovePoint(id: string, position: THREE.Vector3) {
    this.pointManager.setPosition(id, position);
    this.lineManager.update();
  }

  public previewMoveImage(id: string, position: ImageData) {
    this.sceneManager.setPosition(id, position);
  }

  public clearPreview() {
    this.syncSceneFromModel(); // restore authoritative model state
  }

  public hasLineBetween(a: string, b: string): boolean {
    return this.lineManager.hasLineBetween(a, b);
  }

  public handleHover(event: MouseEvent) {
    this.cursorManager.setCursor('default');

    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const intersects = this.raycaster.intersectObjects(this.pointManager.getHitboxes(), false);
    const hoveredPointId = this.pointManager.getFirstHoverablePoint(intersects);

    if (hoveredPointId) {
      this.pointManager.setHovered(hoveredPointId);
      this.lineManager.setHovered(null);
      this.sceneManager.setHoveredGrid(null);
      this.cursorManager.setCursor('pointer');
      return;
    }

    const lineHits = this.raycaster.intersectObjects(this.lineManager.getHitboxes(), false);
    let hoveredLineId = this.lineManager.getFirstHoverableLine(
      lineHits,
      this.pointManager.getSelected()[0],
    );

    if (hoveredLineId) {
      this.pointManager.setHovered(null);
      this.lineManager.setHovered(hoveredLineId);
      this.sceneManager.setHoveredGrid(null);
      this.cursorManager.setCursor('pointer');
      return;
    }

    if (!this.project.settings || this.project.settings.snapToGrid) {
      const planeZ = 0;
      const ray = this.raycaster.ray;

      const t = (planeZ - ray.origin.z) / ray.direction.z;
      const worldPos = new THREE.Vector3().copy(ray.direction).multiplyScalar(t).add(ray.origin);

      const snappedPos = this.sceneManager.snapToGrid(worldPos);

      if (snappedPos) {
        this.pointManager.setHovered(null);
        this.lineManager.setHovered(null);
        this.sceneManager.setHoveredGrid(snappedPos);
        this.cursorManager.setCursor('crosshair');
        return;
      }
    }

    this.pointManager.setHovered(null);
    this.lineManager.setHovered(null);
    this.sceneManager.setHoveredGrid(null);
    this.cursorManager.setCursor('default');
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
