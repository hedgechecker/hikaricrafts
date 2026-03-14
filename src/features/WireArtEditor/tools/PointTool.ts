import type { Tool, ToolContext } from './Tool';
import { AddPointCommand } from '../commands/AddPointCommand';
import { generateId } from '../utils/id';
import { splitLine } from '../utils/commands';

/**
 * Manages the Placement of Points
 * snaps onto the Grid or other Lines
 */
export class PointTool implements Tool {
  private context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
  }

  onMouseUp(event: MouseEvent): void {
    //No Placement on existing Points
    if (this.context.pointRenderer.getHovered()) return;

    let worldPos = this.context.sceneManager.getWorldPosition(event);

    //If a Point is placed on a Line split the line at this point
    const hoveredLine = this.context.lineRenderer.getHovered();
    if (hoveredLine) {
      const cmd = splitLine(worldPos, hoveredLine, this.context.pointRenderer);
      if (cmd) {
        this.context.executeCommand(cmd.command);
      }
      this.context.pointRenderer.handleHover(event);
      return;
    }

    //Snap to Grid
    const point = this.context.sceneManager.getHoveredGrid();
    if (point) {
      worldPos = point;
    }

    this.context.executeCommand(
      new AddPointCommand({
        id: generateId(),
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
      }),
    );
  }

  onMouseMove(event: MouseEvent) {
    this.handleHover(event);
  }

  //Enable Hover for Points, Lines and Grid
  handleHover(event: MouseEvent) {
    this.context.pointRenderer.setHovered(null);
    this.context.lineRenderer.setHovered(null);
    this.context.sceneManager.setHoveredGrid(null);
    this.context.cursorManager.setCursor('default');

    if (this.context.pointRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.context.lineRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor('pointer');
      return;
    }
    if (this.context.sceneManager.handleHover(event)) {
      this.context.cursorManager.setCursor('crosshair');
      return;
    }
  }
}
