import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import { logWarn } from "../../../utils/error/errorHandler";
import type { PatternData } from "../models/Pattern";

/**
 * Command that removes a Pattern 
 * 
 * Does nothing if given Id is invalid
 */
export class DeletePatternCommand implements Command {
  private deletedPattern: PatternData | null = null;
  private patternId: string;

  constructor(patternId: string) {
    this.patternId = patternId;
  }

  execute(model: SceneModel) {
    const pattern = model.patterns.get(this.patternId);
    if (!pattern) {
      logWarn("The given point doesnt exist therefore cant be deleted", {
        function: "DeletePatternCommand/execute",
        patternId: this.patternId,
      });
      return false;
    }

    this.deletedPattern = { ...pattern };

    model.patterns.delete(this.patternId);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.deletedPattern) {
      logWarn("The point cant be restored, because it hasnt been deleted", {
        function: "DeletePatternCommand/undo",
        patternId: this.patternId,
      });
      return false;
    }

    model.patterns.set(this.deletedPattern.id, this.deletedPattern);
    return true;
  }
}
