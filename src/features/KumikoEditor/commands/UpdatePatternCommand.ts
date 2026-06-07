import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";
import type { PatternData } from "../models/Pattern";

/**
 * Command that updates an existing Pattern
 *
 * Does nothing if given Id is Invalid
 */
export class UpdatePatternCommand implements Command {
  private before?: PatternData;
  private after: PatternData;

  constructor(after: PatternData) {
    this.after = after;
  }

  execute(model: SceneModel) {
    const p = model.patterns.get(this.after.id);
    if (!p) {
      logWarn("The given Pattern doesnt exist therefore cant be updated", {
        function: "UpdatePatternCommand/execute",
        pointId: this.after.id,
        after: this.after,
      });
      return false;
    }
    this.before = { ...p };

    Object.assign(p, this.after);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.before) {
      logWarn("The Pattern cant be undone, because it hasnt been updated", {
        function: "UpdatePatternCommand/undo",
        patternId: this.after.id,
        after: this.after,
        before: this.before,
      });
      return false;
    }

    const p = model.patterns.get(this.after.id);
    if (!p) {
      logWarn("The given Pattern doesnt exist therefore cant be updated", {
        function: "UpdatePatternCommand/undo",
        patternId: this.after.id,
      });
      return false;
    }

    Object.assign(p, this.before);
    return true;
  }
}
