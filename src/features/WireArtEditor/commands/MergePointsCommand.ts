import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

interface LineBackup {
  id: string;
  startPointId: string;
  endPointId: string;
}

interface PointBackup {
  id: string;
  x: number;
  y: number;
  z: number;
}

export class MergePointsCommand implements Command {
  private deletedPoint: PointBackup | null = null;
  private originalLines: LineBackup[] = [];
  private createdLines: LineBackup[] = [];
  private sourceId: string;
  private targetId: string;

  constructor(sourceId: string, targetId: string) {
    this.sourceId = sourceId;
    this.targetId = targetId;
  }

  execute(model: DataModel) {
    if (this.sourceId === this.targetId) return;

    const source = model.points.get(this.sourceId);
    const target = model.points.get(this.targetId);
    if (!source || !target) return;

    this.deletedPoint = { ...source };

    // Process all lines
    for (const line of model.lines.values()) {
      if (line.startPointId === this.sourceId || line.endPointId === this.sourceId) {
        this.originalLines.push({ ...line });

        const newStart = line.startPointId === this.sourceId ? this.targetId : line.startPointId;
        const newEnd = line.endPointId === this.sourceId ? this.targetId : line.endPointId;

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
  }

  undo(model: DataModel) {
    if (!this.deletedPoint) return;

    // Restore source point
    model.points.set(this.deletedPoint.id, { ...this.deletedPoint });

    // Restore original lines
    for (const line of this.originalLines) {
      model.lines.set(line.id, { ...line });
    }
  }
}
