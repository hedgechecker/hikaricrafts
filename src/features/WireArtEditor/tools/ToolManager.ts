import { DragTool } from './DragTool';
import { LineTool } from './LineTool';
import { PointTool } from './PointTool';
import type { Tool, ToolContext } from './Tool';

export type ToolType = 'point' | 'line' | 'move' | null;

/**
 * Manages the activation/deactivation of all available Tools
 */
export class ToolManager {
  private domElement: HTMLElement;
  private activeTool: Tool | null = null;
  private tools: Map<string, Tool> = new Map();
  private toolContext: ToolContext;

  constructor(domElement: HTMLElement, toolContext: ToolContext) {
    this.domElement = domElement;
    this.toolContext = toolContext;
    this.domElement.addEventListener('mousedown', this.handleMouseDown);
    this.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.domElement.addEventListener('mouseup', this.handleMouseUp);
    this.domElement.addEventListener('click', this.handleClick);

    this.tools.set("point", new PointTool(toolContext));
    this.tools.set('line', new LineTool(toolContext));
    this.tools.set('move', new DragTool(toolContext));
    this.setActiveTool('move');
  }

  setActiveTool(name: ToolType) {
    this.activeTool?.dispose?.();
    this.activeTool = name ? (this.tools.get(name) ?? null) : null;
    this.toolContext.pointRenderer.setHovered(null);
    this.toolContext.lineRenderer.setHovered(null);
    this.toolContext.sceneManager.setHoveredGrid(null);
    this.toolContext.imageRenderer.setHovered(null);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.activeTool?.onMouseDown?.(e);
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.activeTool?.onMouseMove?.(e);
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.activeTool?.onMouseUp?.(e);
  };

  private handleClick = (e: MouseEvent) => {
    this.activeTool?.onClick?.(e);
  };

  dispose() {
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    this.domElement.removeEventListener('mousemove', this.handleMouseMove);
    this.domElement.removeEventListener('mouseup', this.handleMouseUp);
    this.domElement.removeEventListener('click', this.handleClick);

    this.activeTool?.dispose?.();
  }
}
