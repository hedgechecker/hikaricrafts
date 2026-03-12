import type { Command } from '../models/Command';
import type { PointData } from '../models/Point';
import type { SceneModel } from '../models/SceneModel';
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
    model.points.set(this.point.id, this.point);
  }

  undo(model: SceneModel) {
    model.points.delete(this.point.id);
  }
}
