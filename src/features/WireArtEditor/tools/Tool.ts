
import type { Command } from '../commands/Command';
import type { CursorManager } from '../objects/CursorManager';
import type { ImageRenderer } from '../objects/ImageRenderer';
import type { LineRenderer } from '../objects/LineRenderer';
import type { PointRenderer } from '../objects/PointRenderer';
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
  sceneManager: SceneManager;
  cursorManager: CursorManager;
}
