import type { Command } from "./Command";
import type { LineData } from "../models/Line";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";

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
    if (!line) {
      logWarn("The given line doesnt exist therefore cant be deleted", {
        function: "DeleteLineCommand/execute",
        lineId: this.lineId,
      });
      return false;
    }

    this.deletedLine = { ...line };
    model.lines.delete(this.lineId);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.deletedLine) {
      logWarn("The Line cant be restored, because it hasnt been deleted", {
        function: "DeleteLineCommand/undo",
        lineId: this.lineId,
      });
      return false;
    }

    model.lines.set(this.deletedLine.id, { ...this.deletedLine });
    return true;
  }
}
