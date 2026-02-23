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
import type { Vector3 } from 'three';
import * as THREE from 'three';

import { DataModel } from '../models/DataModel';
import { CommandManager } from '../core/CommandManager';
import type { Command } from '../models/Command';
import { DeletePointCommand } from '../commands/DeletePointCommand';

export type ToolType = 'point' | 'move' | 'line';

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
  private history: CommandManager;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(container: HTMLDivElement) {
    this.model = new DataModel();
    this.history = new CommandManager();
    this.cursorManager = new CursorManager(container);
    this.sceneManager = new SceneManager(container);
    this.storage = new DataStorage();

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
    this.toolManager.setTool(this.moveTool);
    window.addEventListener('keydown', this.onKeyDown);

    this.start();
    this.load('X');
  }

  private syncSceneFromModel() {
    this.pointManager.clear();
    this.lineManager.clear();

    this.model.points.forEach((point) => {
      this.pointManager.addPoint({ x: point.x, y: point.y, z: point.z } as Vector3, point.id);
    });

    this.model.lines.forEach((line) => {
      this.lineManager.addLine(line.startPointId, line.endPointId, line.id);
    });
  }

  load(projectName: string) {
    const data = this.storage.loadFromLocal(projectName);

    // Clear current runtime model
    this.model.points.clear();
    this.model.lines.clear();

    if (!data) {
      this.syncSceneFromModel();
      return;
    }

    // Restore model state
    for (const point of data.points) {
      this.model.points.set(point.id, { ...point });
    }

    for (const line of data.lines) {
      this.model.lines.set(line.id, { ...line });
    }

    // Restore background
    if (data.background) {
      this.sceneManager.setBackground(data.background);
    }

    // Sync rendering layer
    this.syncSceneFromModel();
  }

  private save(projectName: string) {
    this.storage.saveToLocal(projectName, {
      points: Array.from(this.model.points.values()),
      lines: Array.from(this.model.lines.values()),
      background: this.sceneManager.getBackground?.(),
      id: '0',
      name: projectName,
      version: 0,
    });
  }

  public executeCommand(command: Command) {
    console.log(command);
    this.history.execute(command, this.model);
    this.syncSceneFromModel();
  }

  start() {
    const animate = () => {
      const { renderer, scene, camera } = this.sceneManager;
      renderer.render(scene, camera);
      // Keep points constant sizepoints
      this.pointManager.updateScale(camera.zoom);
      this.lineManager.update();
      requestAnimationFrame(animate);
    };
    animate();
  }

  setBackgroundImage(url: string) {
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
  setHovered(id: string[]) {
    this.pointManager.setHovered(id);
  }
  setSelected(id: string[]) {
    this.pointManager.setSelected(id);
  }
  getHoveredPoints(): string[] {
    return this.pointManager.getHovered();
  }
  getSnapCandidates(worldPos: THREE.Vector3, threshold: number): string[] {
    return this.pointManager.getSnapCandidateIds(worldPos, threshold);
  }
  getPointWorldPosition(id: string): THREE.Vector3 | null {
    return this.pointManager.getWorldPositionById(id);
  }
  public clearHover() {
    this.pointManager.setHovered([]);
  }

  private onKeyDown = (e: KeyboardEvent) => {
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
      this.save('X');
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const hovered = this.pointManager.getHovered();
      if (hovered.length > 0) this.deletePoint(hovered[0]);
    }
  };

  public deletePoint(pointId: string) {
    this.executeCommand(new DeletePointCommand(pointId));
    this.syncSceneFromModel();
  }

  public previewMovePoint(id: string, position: THREE.Vector3) {
    this.pointManager.setVisualPosition(id, position);
    this.lineManager.update(); // update line geometry from visual positions
  }

  public clearPreview() {
    this.syncSceneFromModel(); // restore authoritative model state
  }

  public handleHover(event: MouseEvent) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const intersects = this.raycaster.intersectObjects(this.pointManager.getHitboxes(), false);
    const selectedId = this.pointManager.getSelected()[0] ?? null;

    let hoveredGroup: string | null = null;

    for (const inter of intersects) {
      const id = inter.object.parent?.userData.id as string;

      if (id === selectedId) continue;

      hoveredGroup = id;
      break;
    }

    if (hoveredGroup) {
      this.pointManager.setHovered([hoveredGroup]);
      this.cursorManager.setCursor('pointer');
    } else {
      this.pointManager.setHovered([]);
      this.cursorManager.setCursor('default');
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    this.toolManager.dispose();
    this.sceneManager.dispose();
  }
}
