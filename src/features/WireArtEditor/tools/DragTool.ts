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

  onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    // PRIORITY 1 → POINT
    const hoveredPoint = this.context.pointRenderer.getHovered();
    if (hoveredPoint) {
      this.activeTool = 'point';
      this.moveTool.onPointerDown(event);
      return;
    }

    // PRIORITY 2 → IMAGE
    const hoveredImage = this.context.imageRenderer.getHovered();
    if (hoveredImage) {
      this.activeTool = 'image';
      this.transformTool.onPointerDown(event);
      return;
    }

    this.activeTool = 'none';
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

    if (this.context.pointRenderer.handleHover(event)) return;
    if (this.context.imageRenderer.handleHover(event)) return;
  }
}
