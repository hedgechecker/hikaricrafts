import type { Command } from '../models/Command';
import type { PointData } from '../models/Point';
import type { SceneModel } from '../models/SceneModel';

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
    if (!p) return;
    this.before = { ...p };

    p.x = this.after.x;
    p.y = this.after.y;
    p.z = this.after.z;
  }

  undo(model: SceneModel) {
    if (!this.before) return;
    const p = model.points.get(this.after.id);
    if (!p) return;

    p.x = this.before.x;
    p.y = this.before.y;
    p.z = this.before.z;
  }
}
