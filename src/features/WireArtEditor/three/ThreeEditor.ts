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

import { DataModel, type Project } from '../models/DataModel';
import { CommandManager } from '../core/CommandManager';
import type { Command } from '../models/Command';
import { DeletePointCommand } from '../commands/DeletePointCommand';
import { DeleteLineCommand } from '../commands/DeleteLineCommand';

export type ToolType = 'point' | 'move' | 'line';
//Savetofile fromFile
//Scale Image
//line connect to line
//settings line thickness | show points | show grid | show lines
//line length and angle display
//set line length and angle
export class ThreeEditor {
  private sceneManager: SceneManager;
  private pointManager: PointManager;
  private toolManager: ToolManager;
  private cursorManager: CursorManager;
  private lineManager: LineManager;
  private storage: DataStorage;

  private pointTool: PointTool;
  private moveTool: MoveTool;
  private lineTool: LineTool;

  private model: DataModel;
  private project: Project;
  private history: CommandManager;
  private raycaster = new THREE.Raycaster();

  private mouse = new THREE.Vector2();
  private animationFrameId: number | null = null;

  constructor(container: HTMLDivElement) {
    this.model = new DataModel();
    this.history = new CommandManager();
    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.storage = new DataStorage();
    this.project = { points: [], lines: [], id: null, name: '', version: 0 };

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
    this.lineTool = new LineTool(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this,
    );
    this.raycaster.params.Line2 = { threshold: 2 };

    this.toolManager.setTool(this.moveTool);
    window.addEventListener('keydown', this.onKeyDown);
    this.load(this.storage.loadFromLocal());
  }

  private syncSceneFromModel() {
    this.syncPoints();
    this.syncLines();
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

  async loadGlobal(id: number){
    this.load(await this.storage.loadGlobal(id));
  }

  load(data: Project | null) {
    this.model.points.clear();
    this.model.lines.clear();

    if (!data) {
      this.project = { points: [], lines: [], id: null, name: '', version: 0 };
      this.sceneManager.setBackground(this.project.background);
      this.syncSceneFromModel();
      return;
    }
    this.project = data;

    for (const point of this.project.points) {
      this.model.points.set(point.id, { ...point });
    }
    for (const line of this.project.lines) {
      this.model.lines.set(line.id, { ...line });
    }
    this.sceneManager.setBackground(this.project.background);

    this.syncSceneFromModel();
  }

  private saveLocal() {
    this.storage.saveToLocal({
      ...this.project,
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
    });
  }

  private async saveGlobal() {
    this.storage.saveGlobal({
      ...this.project,
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
    });
  }

  public executeCommand(command: Command) {
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

  setBackgroundImage(url: string) {
    this.project.background = url;
    this.sceneManager.setBackground(url);
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
  getHoveredPoint(): string | null {
    return this.pointManager.getHovered();
  }
  getHoveredGridPoint(): THREE.Vector3 | null {
    return this.sceneManager.getHovered();
  }
  getSnapCandidates(worldPos: THREE.Vector3, threshold: number): string[] {
    return this.pointManager.getSnapCandidateIds(worldPos, threshold);
  }
  getPointWorldPosition(id: string): THREE.Vector3 | null {
    return this.pointManager.getWorldPositionById(id);
  }
  public getConnectedPoints(pointId: string): string[] {
    return this.lineManager.getConnectedPoints(pointId);
  }
  public clearHover() {
    this.pointManager.setHovered(null);
  }

  private onKeyDown = async (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (this.history.undo(this.model)) this.syncSceneFromModel();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      if (this.history.redo(this.model)) this.syncSceneFromModel();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveLocal();
      this.saveGlobal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      this.load(await this.storage.loadGlobal(1));
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const hoveredPoint = this.pointManager.getHovered();
      if (hoveredPoint) this.deletePoint(hoveredPoint);
      const hoveredLine = this.lineManager.getHovered();
      if (hoveredLine) this.deleteLine(hoveredLine);
    }
  };

  public deletePoint(pointId: string) {
    this.executeCommand(new DeletePointCommand(pointId));
    this.syncSceneFromModel();
  }

  public deleteLine(lineId: string) {
    this.executeCommand(new DeleteLineCommand(lineId));
    this.syncSceneFromModel();
  }

  public previewMovePoint(id: string, position: THREE.Vector3) {
    this.pointManager.setPosition(id, position);
    this.lineManager.update();
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
      this.sceneManager.setHovered(null);
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
      this.sceneManager.setHovered(null);
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
        this.sceneManager.setHovered(snappedPos);
        this.cursorManager.setCursor('crosshair');
        return;
      }
    }

    this.pointManager.setHovered(null);
    this.lineManager.setHovered(null);
    this.sceneManager.setHovered(null);
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
