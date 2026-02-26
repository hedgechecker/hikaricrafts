import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

interface LineBackup {
  id: string;
  startPointId: string;
  endPointId: string;
}

export class DeleteLineCommand implements Command {
  private deletedLine: LineBackup | null = null;
  private lineId: string;

  constructor(lineId: string) {
    this.lineId = lineId;
  }

  execute(model: DataModel) {
    const line = model.lines.get(this.lineId);
    if (!line) return;

    // Backup line
    this.deletedLine = {
      id: line.id,
      startPointId: line.startPointId,
      endPointId: line.endPointId,
    };

    // Remove line
    model.lines.delete(this.lineId);
  }

  undo(model: DataModel) {
    if (!this.deletedLine) return;

    // Restore line
    model.lines.set(this.deletedLine.id, { ...this.deletedLine });
  }
}
