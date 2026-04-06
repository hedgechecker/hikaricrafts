import type { Command } from "./Command";
import type { PointData } from "../models/Point";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";
/**
 * Command that adds a Point to the SceneModel.
 *
 * Constraints: none
 */
export class AddPointCommand implements Command {
  private point: PointData;

  constructor(point: PointData) {
    this.point = point;
  }

  execute(model: SceneModel) {
    //check if Id is taken
    if (model.points.has(this.point.id)) {
      logWarn("Point with this ID already exists", {
        function: "AddPointCommand/execute",
        pointId: this.point.id,
      });
      return false;
    }
    model.points.set(this.point.id, {...this.point});
    return true;
  }

  undo(model: SceneModel) {
    model.points.delete(this.point.id);
    return true;
  }
}
