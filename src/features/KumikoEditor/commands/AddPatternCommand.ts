import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";
import type { PatternData } from "../models/Pattern";
/**
 * Command that adds a Pattern to the SceneModel.
 *
 * Constraints: none
 */
export class AddPatternCommand implements Command {
  private pattern: PatternData;

  constructor(pattern: PatternData) {
    this.pattern = structuredClone(pattern);
  }

  execute(model: SceneModel) {
    //check if Id is taken
    if (model.patterns.has(this.pattern.id)) {
      logWarn("Pattern with this ID already exists", {
        function: "AddPatternCommand/execute",
        patternId: this.pattern.id,
      });
      return false;
    }
    model.patterns.set(this.pattern.id, {
      ...this.pattern,
    });
    return true;
  }

  undo(model: SceneModel) {
    model.patterns.delete(this.pattern.id);
    return true;
  }
}
