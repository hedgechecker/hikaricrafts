import type { Command } from '../commands/Command';
import type { EditorStore } from '../core/EditorStore';
import type { SceneModel } from '../models/SceneModel';
import type { CursorManager } from '../objects/CursorManager';
import type { GizmoRenderer } from '../objects/Renderer/GizmoRenderer';
import type { GridRenderer } from '../objects/Renderer/GridRenderer';
import type { PatternRenderer } from '../objects/Renderer/PatternRenderer';
import type { SceneManager } from '../objects/SceneManager';
export type ToolType = 'pattern' | 'move' | 'delete' | null;


export interface Tool {
  onPointerDown?(event: PointerEvent): void;
  onPointerMove?(event: PointerEvent): void;
  onPointerUp?(event: PointerEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
  onKeyUp?(event: KeyboardEvent): void;
  onClick?(): void;
  dispose?(): void;
}

export interface ToolContext {
  executeCommand: (command: Command) => void;
  patternRenderer: PatternRenderer;
  gridRenderer: GridRenderer;
  sceneManager: SceneManager;
  cursorManager: CursorManager;
  gizmoRenderer: GizmoRenderer;
  store: EditorStore;
  readonly model: SceneModel;
}
