import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import type { LineData } from "../models/Line";
import { logWarn } from "../../../utils/error/errorHandler";

/**
 * Command that adds a line between two points in the SceneModel.
 *
 * Constraints:
 * - A line cannot connect a point to itself.
 * - Duplicate lines are not allowed
 * - A->B is treated the same as B->A
 */
export class AddLineCommand implements Command {
  private data: LineData;

  constructor(data: LineData) {
    this.data = data;
  }

  execute(model: SceneModel) {
    //check if Id is taken
    if (model.lines.has(this.data.id)) {
      logWarn("Line with this ID already exists", {
        function: "AddLineCommand/execute",
        lineId: this.data.id,
      });
      return false;
    }

    // Prevent self-referential lines
    if (this.data.startPointId === this.data.endPointId) {
      logWarn("Trying to connect the same Points", {
        function: "AddLineCommand/execute",
        startId: this.data.startPointId,
        endId: this.data.endPointId,
        lineId: this.data.id,
      });
      return false;
    }

    // Ensure both Points actually exist
    if (
      !model.points.has(this.data.startPointId) ||
      !model.points.has(this.data.endPointId)
    ) {
      logWarn("Trying to create line with non-existing point(s)", {
        function: "AddLineCommand/execute",
        startId: this.data.startPointId,
        endId: this.data.endPointId,
        hasStart: model.points.has(this.data.startPointId),
        hasEnd: model.points.has(this.data.endPointId),
      });
      return false;
    }

    // Ensure there is no existing line between the same two points
    // (A->B == B->A)
    for (const [, line] of model.lines) {
      const s = line.startPointId;
      const e = line.endPointId;
      if (
        (s === this.data.startPointId && e === this.data.endPointId) ||
        (s === this.data.endPointId && e === this.data.startPointId)
      ) {
        logWarn("Trying to create an existing Line", {
          function: "AddLineCommand/execute",
          newstartId: this.data.startPointId,
          newendId: this.data.endPointId,
          newlineId: this.data.id,
          existingLineId: line.id,
          existingstartId: line.startPointId,
          existingendId: line.endPointId,
        });
        return false;
      }
    }

    model.lines.set(this.data.id, {...this.data});
    return true;
  }

  undo(model: SceneModel) {
    model.lines.delete(this.data.id);
    return true;
  }
}
