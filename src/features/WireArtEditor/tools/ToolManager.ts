import { DeleteTool } from './DeleteTool';
import { DragTool } from './DragTool';
import { LineTool } from './LineTool';
import { PointTool } from './PointTool';
import { ResizeTool } from './ResizeTool';
import type { Tool, ToolContext, ToolType } from './Tool';
import { VerifyTool } from './VerifyTool';


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
    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.domElement.addEventListener('pointerup', this.handlePointerUp);

    this.tools.set("point", new PointTool(toolContext));
    this.tools.set('line', new LineTool(toolContext));
    this.tools.set('move', new DragTool(toolContext));
    this.tools.set('verify', new VerifyTool(toolContext));
    this.tools.set('delete', new DeleteTool(toolContext));
    this.tools.set("resize", new ResizeTool(toolContext));
    this.setActiveTool('move');
  }

  setActiveTool(name: ToolType) {
    this.activeTool?.dispose?.();
    this.activeTool = name ? (this.tools.get(name) ?? null) : null;
    this.activeTool?.onClick?.();
    this.toolContext.pointRenderer.setHovered(null);
    this.toolContext.lineRenderer.setHovered(null);
    this.toolContext.pointRenderer.setSelected([]);
    this.toolContext.lineRenderer.setSelected([]);

    this.toolContext.gridRenderer.setHovered(null);
    this.toolContext.imageRenderer.setHovered(null);
    this.toolContext.cursorManager.setCursor('default');
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.activeTool?.onPointerDown?.(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.activeTool?.onPointerMove?.(e);
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.activeTool?.onPointerUp?.(e);
  };


  dispose() {
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.domElement.removeEventListener('pointerup', this.handlePointerUp);

    this.activeTool?.dispose?.();
  }
}
