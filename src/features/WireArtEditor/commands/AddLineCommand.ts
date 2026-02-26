import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

export class AddLineCommand implements Command {
  private id: string;
  private startId: string;
  private endId: string;

  constructor(id: string, startId: string, endId: string) {
    this.id = id;
    this.startId = startId;
    this.endId = endId;
  }

  execute(model: DataModel) {
    if (this.startId === this.endId) {
      return;
    }

    for (const [, line] of model.lines) {
      const s = line.startPointId;
      const e = line.endPointId;

      if ((s === this.startId && e === this.endId) || (s === this.endId && e === this.startId)) {
        return; // duplicate found
      }
    }

    model.lines.set(this.id, {
      id: this.id,
      startPointId: this.startId,
      endPointId: this.endId,
    });
  }

  undo(model: DataModel) {
    model.lines.delete(this.id);
  }
}
