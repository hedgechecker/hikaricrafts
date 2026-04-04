import type { Tool, ToolContext } from './Tool';
import { MoveTool } from './MoveTool';
import { TransformTool } from './TransformTool';

type ActiveTool = 'none' | 'point' | 'image';

/**
 * Merges the MoveTool and TransformTool to handle the movement of both Images and Points
 */
export class DragTool implements Tool {
  private context: ToolContext;

  private moveTool: MoveTool;
  private transformTool: TransformTool;

  private activeTool: ActiveTool = 'none';

  constructor(context: ToolContext) {
    this.context = context;

    this.moveTool = new MoveTool(context);
    this.transformTool = new TransformTool(context);
  }

  onClick(): void {
    this.transformTool.onClick();
  }

  onPointerDown(event: PointerEvent) {
    this.handleHover(event);
    if (event.button !== 0) return;

    if (this.activeTool === "point") {
      this.moveTool.onPointerDown(event);
      return;
    }

    if (this.activeTool === "image") {
      this.transformTool.onPointerDown(event);
      return;
    }
  }

  onPointerMove(event: PointerEvent) {
    if (this.activeTool === 'point') {
      this.moveTool.onPointerMove(event);
      return;
    }

    if (this.activeTool === 'image') {
      this.transformTool.onPointerMove(event);
      return;
    }

    // Hover behavior when nothing is active
    this.handleHover(event);
  }

  onPointerUp(event: PointerEvent) {
    this.context.sceneManager.setPanEnabled(true);

    if (this.activeTool === 'point') {
      this.moveTool.onPointerUp();
    }

    if (this.activeTool === 'image') {
      this.transformTool.onPointerUp(event);
    }

    this.activeTool = 'none';
  }

  handleHover(event: PointerEvent) {
    // Prefer point hover
    this.context.pointRenderer.setHovered(null);
    this.context.imageRenderer.setHovered(null);

    if (this.context.pointRenderer.handleHover(event)) {
     this.activeTool = "point";
     return; 
    }
    if (this.context.imageRenderer.handleHover(event) || this.context.gizmoRenderer.handleHover(event)) {
     this.activeTool = "image";
     return; 
    }
    this.activeTool = "none";
  }

  dispose(): void {
    this.transformTool.dispose();
    //this.moveTool.dispose();
  }
}
