import { DeleteTool } from './DeleteTool';
import { MoveTool } from './MoveTool';
import { PatternTool } from "./PatternTool";
import type { Tool, ToolContext, ToolType } from './Tool';


/**
 * Manages the activation/deactivation of all available Tools
 */
export class ToolManager {
  private domElement: HTMLElement;
  private activeTool: Tool | null = null;
  private tools: Map<ToolType, Tool> = new Map();
  private toolContext: ToolContext;

  constructor(domElement: HTMLElement, toolContext: ToolContext) {
    this.domElement = domElement;
    this.toolContext = toolContext;
    this.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.domElement.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.tools.set("pattern", new PatternTool(toolContext));
    this.tools.set("move", new MoveTool(toolContext));
    this.tools.set("delete", new DeleteTool(toolContext));
    this.setActiveTool("pattern");
  }

  setActiveTool(name: ToolType) {
    this.activeTool?.dispose?.();
    this.activeTool = name ? (this.tools.get(name) ?? null) : null;
    this.activeTool?.onClick?.();
    this.toolContext.patternRenderer.setHovered(null);
    this.toolContext.patternRenderer.setSelected([]);

    this.toolContext.gridRenderer.setHovered(null);
    this.toolContext.cursorManager.setCursor("default");

    this.toolContext.sceneManager.render();
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

  private handleKeyUp = (e: KeyboardEvent) => {
    this.activeTool?.onKeyUp?.(e);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.activeTool?.onKeyDown?.(e);
  };

  dispose() {
    this.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.domElement.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    this.activeTool?.dispose?.();
  }
}
