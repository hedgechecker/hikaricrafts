import type { Command } from '../models/Command';
import type { SceneModel } from '../models/SceneModel';
import type { LineData } from '../models/Line';

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
    // Prevent self-referential lines
    if (this.data.startPointId === this.data.endPointId) {
      return;
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
        return;
      }
    }

    model.lines.set(this.data.id, this.data);
  }

  undo(model: SceneModel) {
    model.lines.delete(this.data.id);
  }
}
