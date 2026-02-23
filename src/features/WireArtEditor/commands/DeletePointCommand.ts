import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

interface LineBackup {
  id: string;
  startPointId: string;
  endPointId: string;
}

export class DeletePointCommand implements Command {
  private deletedLines: LineBackup[] = [];
  private deletedPoint: { id: string; x: number; y: number; z: number } | null = null;
  private pointId: string;

  constructor(pointId: string) {
    this.pointId = pointId;
  }

  execute(model: DataModel) {
    const point = model.points.get(this.pointId);
    if (!point) return;

    // Backup point
    this.deletedPoint = { ...point };

    // Backup connected lines
    for (const line of model.lines.values()) {
      if (line.startPointId === this.pointId || line.endPointId === this.pointId) {
        this.deletedLines.push({ id: line.id, startPointId: line.startPointId, endPointId: line.endPointId });
      }
    }

    // Remove connected lines
    for (const line of this.deletedLines) {
      model.lines.delete(line.id);
    }

    // Remove point
    model.points.delete(this.pointId);
  }

  undo(model: DataModel) {
    if (!this.deletedPoint) return;

    // Restore point
    model.points.set(this.deletedPoint.id, { ...this.deletedPoint });

    // Restore lines
    for (const line of this.deletedLines) {
      model.lines.set(line.id, { ...line });
    }
  }
}
