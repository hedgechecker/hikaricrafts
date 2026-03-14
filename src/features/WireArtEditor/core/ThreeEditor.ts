import { PointRenderer } from '../objects/PointRenderer';
import { LineRenderer } from '../objects/LineRenderer';
import { SceneManager } from '../objects/SceneManager';
import { ToolManager, type ToolType } from '../tools/ToolManager';
import { CursorManager } from '../objects/CursorManager';

import { DataStorage } from '../core/DataStorage';
import * as THREE from 'three';
import { SceneModel } from '../models/SceneModel';
import { type Project } from '../models/Project';
import { CommandManager } from '../commands/CommandManager';
import type { Command } from '../models/Command';
import { DeletePointCommand } from '../commands/DeletePointCommand';
import { DeleteLineCommand } from '../commands/DeleteLineCommand';
import { SVGExporter } from '../core/SVGExporter';
import type { Settings } from '../models/Settings';
import { AddImageCommand } from '../commands/AddImageCommand';
import { generateId } from '../utils/id';
import { DeleteImageCommand } from '../commands/DeleteImageCommand';
import { ImageRenderer } from '../objects/ImageRenderer';

//Import SVG?

//check points 0/1 connections
//get all polygons
//check convex hull
//check minsize
//check minSideHeight
//check lineIntersections
export class ThreeEditor {
  private pointRenderer: PointRenderer;
  private lineRenderer: LineRenderer;
  private imageRenderer: ImageRenderer;
  private sceneManager: SceneManager;
  private cursorManager: CursorManager;

  private toolManager: ToolManager;
  private storage: DataStorage;

  private model: SceneModel;
  private project: Project;
  private history: CommandManager;

  private animationFrameId: number | null = null;
  public hasChanges = false;

  constructor(container: HTMLDivElement) {
    this.model = new SceneModel();
    this.history = new CommandManager();
    this.storage = new DataStorage();
    this.project = this.storage.getEmptyProject();

    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.pointRenderer = new PointRenderer(this.sceneManager);
    this.lineRenderer = new LineRenderer(this.sceneManager, this.pointRenderer);
    this.imageRenderer = new ImageRenderer(this.sceneManager);

    const toolContext = {
      executeCommand: (command: Command) => this.executeCommand(command),
      pointRenderer: this.pointRenderer,
      lineRenderer: this.lineRenderer,
      imageRenderer: this.imageRenderer,
      sceneManager: this.sceneManager,
      cursorManager: this.cursorManager,
    };
    this.toolManager = new ToolManager(this.sceneManager.renderer.domElement, toolContext);

    window.addEventListener('keydown', this.onKeyDown);
    this.load(this.storage.loadFromLocal());
  }

  private syncSceneFromModel() {
    this.syncPoints();
    this.syncLines();
    this.syncImages();
  }

  private syncPoints() {
    const existing = new Set(this.pointRenderer.getAllIds());
    for (const point of this.model.points.values()) {
      if (!this.pointRenderer.hasPoint(point.id)) {
        this.pointRenderer.addPoint(new THREE.Vector3(point.x, point.y, point.z), point.id);
      } else {
        this.pointRenderer.setPosition(point.id, new THREE.Vector3(point.x, point.y, point.z));
      }
      existing.delete(point.id);
    }
    for (const id of existing) {
      this.pointRenderer.removePoint(id);
    }
  }

  private syncLines() {
    const existing = new Set(this.lineRenderer.getAllIds());
    for (const line of this.model.lines.values()) {
      if (!this.lineRenderer.hasLine(line.id)) {
        this.lineRenderer.addLine(line.startPointId, line.endPointId, line.id);
      } else {
        this.lineRenderer.updateConnection(line.id, line.startPointId, line.endPointId);
      }
      existing.delete(line.id);
    }
    for (const id of existing) {
      this.lineRenderer.removeLine(id);
    }
  }

  private syncImages() {
    const existing = new Set(this.imageRenderer.getAllIds());
    for (const image of this.model.images.values()) {
      if (!this.imageRenderer.hasImage(image.id)) {
        this.imageRenderer.addImage(image);
      } else {
        this.imageRenderer.updateImage(image);
      }
      existing.delete(image.id);
    }
    for (const id of existing) {
      this.imageRenderer.removeImage(id);
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
        this.pointRenderer.updateScale(camera.zoom);
        this.lineRenderer.updateScale(camera.zoom);
        this.imageRenderer.updateScale(camera.zoom);
        this.sceneManager.update();
        lastZoom = camera.zoom;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  addBackgroundImage(url: string) {
    this.executeCommand(
      new AddImageCommand({
        id: generateId(),
        url: url,
        x: 0,
        y: 0,
        z: -5,
        rotation: 0,
        height: 10,
      }),
    );
  }
  setActiveTool(type: ToolType) {
    this.toolManager.setActiveTool(type);
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
              this.imageRenderer.setImageVisible(settings.showImage);
              break;
            case 'showPoints':
              this.pointRenderer.setPointsVisible(settings.showPoints);
              break;
            case 'pointColor':
              this.pointRenderer.setPointColor(settings.pointColor);
              break;
            case 'lineColor':
              this.lineRenderer.setLineColor(settings.lineColor);
              break;
          }
        }
      });
    }
    this.project.settings = settings;
  }

  getProject() {
    return this.project;
  }
  exportSVG() {
    SVGExporter.simpleExport(this.model, this.project);
  }

  private onKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'i') {
      e.preventDefault();
      this.toolManager.setActiveTool('transform');
    }
    if (e.key === 'o') {
      e.preventDefault();
      this.toolManager.setActiveTool(null);
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
      const hoveredPoint = this.pointRenderer.getHovered();
      if (hoveredPoint) {
        this.executeCommand(new DeletePointCommand(hoveredPoint));
        this.syncSceneFromModel();
      }
      const hoveredLine = this.lineRenderer.getHovered()?.id;
      if (hoveredLine) {
        this.executeCommand(new DeleteLineCommand(hoveredLine));
        this.syncSceneFromModel();
      }
      const hoveredImage = this.imageRenderer.getHovered();
      if (hoveredImage) {
        this.executeCommand(new DeleteImageCommand(hoveredImage));
        this.syncSceneFromModel();
      }
    }
  };

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
