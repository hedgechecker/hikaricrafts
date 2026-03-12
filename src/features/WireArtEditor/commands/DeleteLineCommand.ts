import type { Command } from '../models/Command';
import type { LineData } from '../models/Line';
import type { SceneModel } from '../models/SceneModel';

/**
 * Command that removes a Line from the SceneModel.
 *
 * Does nothing if given Id is invalid
 */
export class DeleteLineCommand implements Command {
  private deletedLine: LineData | null = null;
  private lineId: string;

  constructor(lineId: string) {
    this.lineId = lineId;
  }

  execute(model: SceneModel) {
    const line = model.lines.get(this.lineId);
    if (!line) return;

    this.deletedLine = { ...line };
    model.lines.delete(this.lineId);
  }

  undo(model: SceneModel) {
    if (!this.deletedLine) return;

    model.lines.set(this.deletedLine.id, this.deletedLine);
  }
}
