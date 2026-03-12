import type { Command } from '../models/Command';
import type { LineData } from '../models/Line';
import type { PointData } from '../models/Point';
import type { SceneModel } from '../models/SceneModel';

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
    if (!point) return;

    this.deletedPoint = { ...point };

    // Backup connected lines
    for (const line of model.lines.values()) {
      if (line.startPointId === this.pointId || line.endPointId === this.pointId) {
        this.deletedLines.push({ ...line });
      }
    }

    for (const line of this.deletedLines) {
      model.lines.delete(line.id);
    }
    model.points.delete(this.pointId);
  }

  undo(model: SceneModel) {
    if (!this.deletedPoint) return;

    model.points.set(this.deletedPoint.id, this.deletedPoint);
    for (const line of this.deletedLines) {
      model.lines.set(line.id, line);
    }
  }
}
