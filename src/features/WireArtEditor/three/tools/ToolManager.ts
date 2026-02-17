import type { Tool } from "./Tool";

export class ToolManager {
  private domElement: HTMLElement;
  private activeTool: Tool | null = null;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.domElement.addEventListener("mousedown", this.handleMouseDown);
    this.domElement.addEventListener("mousemove", this.handleMouseMove);
    this.domElement.addEventListener("mouseup", this.handleMouseUp);
    this.domElement.addEventListener("click", this.handleClick);
  }

  setTool(tool: Tool | null) {
    this.activeTool?.dispose?.();
    this.activeTool = tool;
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
    this.domElement.removeEventListener("mousedown", this.handleMouseDown);
    this.domElement.removeEventListener("mousemove", this.handleMouseMove);
    this.domElement.removeEventListener("mouseup", this.handleMouseUp);
    this.domElement.removeEventListener("click", this.handleClick);

    this.activeTool?.dispose?.();
  }
}
