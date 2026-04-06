import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";

/**
 * Bundles multiple Commands into one to be executed and undone in a single action
 */
export class CompositeCommand implements Command {
  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  /**
   * Executes all commands as one atomic operation
   * @param model Source of Truth
   * @returns if successfull
   */
  execute(model: SceneModel) {
    const executed: Command[] = [];

    for (const cmd of this.commands) {
      const result = cmd.execute(model);

      if (!result) {
        // rollback already executed commands
        for (let i = executed.length - 1; i >= 0; i--) {
          executed[i].undo(model);
        }
        return false;
      }

      executed.push(cmd);
    }

    return true;
  }

  /**
   * Undoes all commands as one atomic operation
   * @param model Source of Truth
   * @returns if successfull
   */
  undo(model: SceneModel) {
    const undone: Command[] = [];

    for (let i = this.commands.length - 1; i >= 0; i--) {
      const cmd = this.commands[i];
      const result = cmd.undo(model);

      if (!result) {
        // rollback undo (re-execute what we already undid)
        for (let j = undone.length - 1; j >= 0; j--) {
          undone[j].execute(model);
        }
        return false;
      }

      undone.push(cmd);
    }

    return true;
  }
}
