import type { Command } from "./Command";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";
/**
 * Command that merges a given Point to another Point, duplicate Lines get Removed
 *
 * Does nothing if given Ids are the same or Invalid
 */
export class MergePointsCommand implements Command {
  private deletedPoint: PointData | null = null;
  private originalLines: LineData[] = [];
  private createdLines: LineData[] = [];
  private sourceId: string;
  private targetId: string;

  constructor(sourceId: string, targetId: string) {
    this.sourceId = sourceId;
    this.targetId = targetId;
  }

  execute(model: SceneModel) {
    if (this.sourceId === this.targetId) {
      logWarn("A point cant be merged to itself", {
        function: "MergePointsCommand/execute",
        sourceId: this.sourceId,
        targetId: this.targetId,
      });
      return false;
    }

    const source = model.points.get(this.sourceId);
    const target = model.points.get(this.targetId);
    if (!source || !target) {
      logWarn("One or more given Ids dont exist", {
        function: "MergePointsCommand/execute",
        source: source,
        target: target,
      });
      return false;
    }

    this.deletedPoint = { ...source };

    // Process all lines
    for (const line of model.lines.values()) {
      if (
        line.startPointId === this.sourceId ||
        line.endPointId === this.sourceId
      ) {
        this.originalLines.push({ ...line });

        const newStart =
          line.startPointId === this.sourceId
            ? this.targetId
            : line.startPointId;
        const newEnd =
          line.endPointId === this.sourceId ? this.targetId : line.endPointId;

        // Prevent self-loop
        if (newStart === newEnd) {
          model.lines.delete(line.id);
          continue;
        }

        // Prevent duplicate line
        const duplicate = Array.from(model.lines.values()).find(
          (l) =>
            (l.startPointId === newStart && l.endPointId === newEnd) ||
            (l.startPointId === newEnd && l.endPointId === newStart),
        );

        if (!duplicate) {
          line.startPointId = newStart;
          line.endPointId = newEnd;
          this.createdLines.push({ ...line });
        } else {
          model.lines.delete(line.id);
        }
      }
    }

    // Remove source point
    model.points.delete(this.sourceId);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.deletedPoint) {
      logWarn("The Points cant be restored, because they havent been merged", {
        function: "MergePointsCommand/undo",
        deletedPoint: this.deletedPoint,
        sourceId: this.sourceId,
        targetId: this.targetId,
      });
      return false;
    }
    model.points.set(this.deletedPoint.id, { ...this.deletedPoint });

    for (const line of this.originalLines) {
      model.lines.set(line.id, { ...line });
    }
    return true;
  }
}
