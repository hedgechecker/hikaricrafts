import type { Command } from '../commands/Command';
import type { SceneModel } from '../models/SceneModel';
import type { CursorManager } from '../objects/CursorManager';
import type { GridRenderer } from '../objects/Renderer/GridRenderer';
import type { ImageRenderer } from '../objects/Renderer/ImageRenderer';
import type { LineRenderer } from '../objects/Renderer/LineRenderer';
import type { PointRenderer } from '../objects/Renderer/PointRenderer';
import type { SceneManager } from '../objects/SceneManager';
export type ToolType = 'point' | 'line' | 'move'  | 'verify' | 'delete' | 'resize' | null;


export interface Tool {
  onPointerDown?(event: PointerEvent): void;
  onPointerMove?(event: PointerEvent): void;
  onPointerUp?(event: PointerEvent): void;
  onClick?(): void;
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
