import type { Command } from "../models/Command";
import type { DataModel } from "../models/DataModel";

/**
 * Bundles multiple Commands into one to be executed and undone in a single action
 */
export class CompositeCommand {
  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  execute(model: DataModel) {
    for (const cmd of this.commands) {
      cmd.execute(model);
    }
  }

  undo(model: DataModel) {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo(model);
    }
  }
}
