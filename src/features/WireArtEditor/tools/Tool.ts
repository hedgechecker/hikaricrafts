import type { Command } from '../commands/Command';
import type { SceneModel } from '../models/SceneModel';
import type { CursorManager } from '../objects/CursorManager';
import type { GridRenderer } from '../objects/Renderer/GridRenderer';
import type { ImageRenderer } from '../objects/Renderer/ImageRenderer';
import type { LineRenderer } from '../objects/Renderer/LineRenderer';
import type { PointRenderer } from '../objects/Renderer/PointRenderer';
import type { SceneManager } from '../objects/SceneManager';

export interface Tool {
  onMouseDown?(event: MouseEvent): void;
  onMouseMove?(event: MouseEvent): void;
  onMouseUp?(event: MouseEvent): void;
  onClick?(event: MouseEvent): void;
  dispose?(): void;
}

export interface ToolContext {
  executeCommand: (command: Command) => void;
  pointRenderer: PointRenderer;
  lineRenderer: LineRenderer;
  imageRenderer: ImageRenderer;
  gridRenderer: GridRenderer;
  sceneManager: SceneManager;
  cursorManager: CursorManager;
  readonly model: SceneModel;
}
