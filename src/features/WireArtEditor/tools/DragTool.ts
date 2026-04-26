import type { Tool, ToolContext } from "./Tool";
import { MoveTool } from "./MoveTool";
import { TransformTool } from "./TransformTool";

type ActiveTool = "none" | "point" | "image";

/**
 * Merges the MoveTool and TransformTool to handle the movement of both Images and Points
 */
export class DragTool implements Tool {
  private context: ToolContext;

  private moveTool: MoveTool;
  private transformTool: TransformTool;

  private activeTool: ActiveTool = "none";

  constructor(context: ToolContext) {
    this.context = context;

    this.moveTool = new MoveTool(context);
    this.transformTool = new TransformTool(context);
  }

  onClick(): void {
    this.transformTool.onClick();
  }

  onKeyDown(event: KeyboardEvent): void {
    this.moveTool.onKeyDown(event);
    //this.transformTool.onKeyDown(event);
  }
  onKeyUp(event: KeyboardEvent): void {
    this.moveTool.onKeyUp(event);
    //this.transformTool.onKeyUp(event);
  }

  onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    // Decide target ONCE
    if (this.context.pointRenderer.handleHover(event)) {
      this.activeTool = "point";
      this.context.imageRenderer.setHovered(null);
      this.moveTool.onPointerDown(event);
      return;
    } else if (
      this.context.imageRenderer.handleHover(event) ||
      this.context.gizmoRenderer.handleHover(event)
    ) {
      this.activeTool = "image";
      this.context.pointRenderer.setHovered(null);
      this.transformTool.onPointerDown(event);
      return;
    } else {
      this.activeTool = "none";
      //this.moveTool.onPointerDown(event);
      //this.transformTool.onPointerDown(event);
    }
  }

  onPointerMove(event: PointerEvent) {
    this.handleHover(event);
    if (this.activeTool === "point") {
      this.moveTool.onPointerMove(event);
      return;
    }

    if (this.activeTool === "image") {
      this.transformTool.onPointerMove(event);
      return;
    }
  }

  onPointerUp(event: PointerEvent) {
    this.context.sceneManager.setPanEnabled(true);

    if (this.activeTool === "point") {
      this.moveTool.onPointerUp();
    }

    if (this.activeTool === "image") {
      this.transformTool.onPointerUp(event);
    }

    this.activeTool = "none";
    // this.context.gizmoRenderer.setVisible(false);
  }

  handleHover(event: PointerEvent) {
    if (this.context.pointRenderer.handleHover(event)) {
      this.context.imageRenderer.setHovered(null);
      this.context.gizmoRenderer.setVisible(false);
      return;
    }

    if (
      this.context.imageRenderer.handleHover(event) ||
      this.context.gizmoRenderer.handleHover(event)
    ) {
      this.context.imageRenderer.setHovered(null);
      this.context.pointRenderer.setHovered(null);
      //this.context.gizmoRenderer.setVisible(true);
      return;
    }

    this.context.imageRenderer.setHovered(null);
    this.context.pointRenderer.setHovered(null);
  }

  dispose(): void {
    this.transformTool.dispose();
    //this.moveTool.dispose();
  }
}
