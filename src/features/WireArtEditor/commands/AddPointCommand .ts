import type { Command } from '../models/Command';
import type { DataModel, PointData } from '../models/DataModel';
/**
 * Command that adds a Point to the DataModel.
 *
 * Constraints: none
 */
export class AddPointCommand implements Command {
  private point: PointData;
  
  constructor(point: PointData) {
    this.point = point;
  }

  execute(model: DataModel) {
    model.points.set(this.point.id, this.point);
  }

  undo(model: DataModel) {
    model.points.delete(this.point.id);
  }
}
