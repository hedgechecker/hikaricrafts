import type { Command } from "./Command";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";

/**
 * Command that removes a Point and all connected Lines from the SceneModel.
 *
 * Does nothing if given Id is invalid
 */
export class DeletePointCommand implements Command {
  private deletedLines: LineData[] = [];
  private deletedPoint: PointData | null = null;
  private pointId: string;

  constructor(pointId: string) {
    this.pointId = pointId;
  }

  execute(model: SceneModel) {
    const point = model.points.get(this.pointId);
    if (!point) {
      logWarn("The given point doesnt exist therefore cant be deleted", {
        function: "DeletePointCommand/execute",
        pointId: this.pointId,
      });
      return false;
    }

    this.deletedPoint = { ...point };

    // Backup connected lines
    for (const line of model.lines.values()) {
      if (
        line.startPointId === this.pointId ||
        line.endPointId === this.pointId
      ) {
        this.deletedLines.push({ ...line });
      }
    }
    for (const line of this.deletedLines) {
      model.lines.delete(line.id);
    }

    model.points.delete(this.pointId);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.deletedPoint) {
      logWarn("The point cant be restored, because it hasnt been deleted", {
        function: "DeletePointCommand/undo",
        pointId: this.pointId,
      });
      return false;
    }

    model.points.set(this.deletedPoint.id, this.deletedPoint);
    for (const line of this.deletedLines) {
      model.lines.set(line.id, line);
    }
    return true;
  }
}
