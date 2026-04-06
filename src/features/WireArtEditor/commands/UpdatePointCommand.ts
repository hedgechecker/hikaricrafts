import type { Command } from "./Command";
import type { PointData } from "../models/Point";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";

/**
 * Command that updates an existing Point
 *
 * Does nothing if given Id is Invalid
 */
export class UpdatePointCommand implements Command {
  private before?: PointData;
  private after: PointData;

  constructor(after: PointData) {
    this.after = after;
  }

  execute(model: SceneModel) {
    const p = model.points.get(this.after.id);
    if (!p) {
      logWarn("The given Point doesnt exist therefore cant be updated", {
        function: "UpdatePointCommand/execute",
        pointId: this.after.id,
        after: this.after,
      });
      return false;
    }
    this.before = { ...p };

    Object.assign(p, this.after);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.before) {
      logWarn("The Point cant be updated, because it hasnt been updated", {
        function: "UpdatePointCommand/undo",
        pointId: this.after.id,
        after: this.after,
        before: this.before,
      });
      return false;
    }

    const p = model.points.get(this.after.id);
    if (!p) {
      logWarn("The given Point doesnt exist therefore cant be updated", {
        function: "UpdatePointCommand/undo",
        pointId: this.after.id,
      });
      return false;
    }

    Object.assign(p, this.before);
    return true;
  }
}
