import { PointRenderer } from '../objects/Renderer/PointRenderer';
import { LineRenderer } from '../objects/Renderer/LineRenderer';
import { SceneManager } from '../objects/SceneManager';
import { ToolManager } from '../tools/ToolManager';
import { CursorManager } from '../objects/CursorManager';

import { DataStorage } from '../core/DataStorage';
import { SceneModel } from '../models/SceneModel';
import { type Project } from '../models/Project';
import { CommandManager } from '../commands/CommandManager';
import { DeletePointCommand } from '../commands/DeletePointCommand';
import { DeleteLineCommand } from '../commands/DeleteLineCommand';
import { SVGExporter } from '../core/SVGExporter';
import type { Settings } from '../models/Settings';
import { AddImageCommand } from '../commands/AddImageCommand';
import { generateId } from '../utils/id';
import { DeleteImageCommand } from '../commands/DeleteImageCommand';
import { ImageRenderer } from '../objects/Renderer/ImageRenderer';
import type { Command } from '../commands/Command';
import { GridRenderer } from '../objects/Renderer/GridRenderer';
import { EditorStore } from './EditorStore';
import type { ToolType } from '../tools/Tool';
import { OrthographicCamera } from 'three';

//Import SVG?
//Highlight Line length input correctly

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
  private gridRenderer: GridRenderer;
  public sceneManager: SceneManager;
  private cursorManager: CursorManager;

  private toolManager: ToolManager;
  private storage: DataStorage;
  private store = new EditorStore();
  private container: HTMLDivElement;

  private model: SceneModel;
  private project: Project;
  private history: CommandManager;

  private animationFrameId: number | null = null;
  public hasChanges = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.model = new SceneModel();
    this.history = new CommandManager();
    this.storage = new DataStorage();
    this.project = this.storage.getEmptyProject();

    this.cursorManager = new CursorManager(this.container);
    this.sceneManager = new SceneManager(this.container);
    this.pointRenderer = new PointRenderer(this.sceneManager);
    this.lineRenderer = new LineRenderer(this.sceneManager, this.pointRenderer);
    this.imageRenderer = new ImageRenderer(this.sceneManager);
    this.gridRenderer = new GridRenderer(this.sceneManager);

    const toolContext = {
      executeCommand: (command: Command) => this.executeCommand(command),
      pointRenderer: this.pointRenderer,
      lineRenderer: this.lineRenderer,
      imageRenderer: this.imageRenderer,
      gridRenderer: this.gridRenderer,
      sceneManager: this.sceneManager,
      cursorManager: this.cursorManager,
      model: this.model,
    };
    this.toolManager = new ToolManager(this.sceneManager.renderer.domElement, toolContext);

    window.addEventListener('keydown', this.onKeyDown);
    this.load(this.storage.loadFromLocal());
    this.start();
    const project = this.getProject();
    if (project) {
      this.store.setProject(project);
    }
  }

  private syncSceneFromModel() {
    this.pointRenderer.sync([...this.model.points.values()]);
    this.lineRenderer.sync([...this.model.lines.values()]);
    this.imageRenderer.sync([...this.model.images.values()]);
    this.saveLocal();
  }

  async loadGlobal(id: number) {
    this.load(await this.storage.loadGlobal(id));
    this.store.setProject(this.getProject());
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
      this.store.setProject(project);
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

  public async save() {
    if (!this.hasChanges) {
      return;
    }
    this.hasChanges = false;
    this.project.version = this.project.version + 1;
    const id = this.project.id;
    this.saveLocal();
    await this.saveGlobal();
    if (id != this.project.id) {
      this.store.setProject(this.project);
    }
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
    const savedProject = await this.storage.saveGlobal({
      ...this.project,
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
      images: Array.from(this.model.images.values()),
    });
    if (!savedProject) return;
    this.project = savedProject;
    this.store.setProject(savedProject);

    this.hasChanges = false;
  }

  public executeCommand(command: Command) {
    this.hasChanges = true;
    console.log(command);
    this.history.execute(command, this.model);
    this.syncSceneFromModel();
  }

  public redo() {
    if (this.history.redo(this.model)) this.syncSceneFromModel();
  }

  public undo() {
    if (this.history.undo(this.model)) this.syncSceneFromModel();
  }

  start() {
    let lastZoom = 0;
    const animate = () => {

      this.sceneManager.update();
      const { renderer, scene, camera } = this.sceneManager;
      //console.log(camera.position);

      renderer.render(scene, camera);
      if (camera instanceof OrthographicCamera) {
        if (camera.zoom != lastZoom) {
          this.pointRenderer.updateScale(camera.zoom);
          this.lineRenderer.updateScale(camera.zoom);
          this.imageRenderer.updateScale(camera.zoom);
          this.gridRenderer.updateScale(camera.zoom);
          lastZoom = camera.zoom;
        }
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  resize(container: HTMLDivElement) {
    this.container = container;
    this.sceneManager.container = container;
    this.sceneManager.onResize();
  }

  addBackgroundImage(url: string) {
    this.executeCommand(
      new AddImageCommand({
        id: generateId(),
        url: url,
        x: 0,
        y: 0,
        z: -0.5,
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
              this.gridRenderer.setVisible(settings.showGrid);
              break;
            case 'showImage':
              this.imageRenderer.setVisible(settings.showImage);
              break;
            case 'showPoints':
              this.pointRenderer.setVisible(settings.showPoints);
              break;
            case 'pointColor':
              this.pointRenderer.setColorAll(settings.pointColor);
              break;
            case 'lineColor':
              this.lineRenderer.setColorAll(settings.lineColor);
              break;
          }
        }
      });
    }
    this.project.settings = settings;
    this.store.updateSettings(settings);
  }

  getProject() {
    return this.project;
  }
  getStore() {
    return this.store;
  }
  exportSVG() {
    SVGExporter.simpleExport(this.model, this.project);
  }

  private onKeyDown = async (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      this.undo();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      this.redo();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const hoveredPoint = this.pointRenderer.getHovered();
      if (hoveredPoint) {
        this.executeCommand(new DeletePointCommand(hoveredPoint));
        this.syncSceneFromModel();
      }
      const hoveredLine = this.lineRenderer.getHovered();
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
