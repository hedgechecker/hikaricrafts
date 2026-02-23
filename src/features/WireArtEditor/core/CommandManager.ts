import type { Command } from "../models/Command";
import type { DataModel } from "../models/DataModel";

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command, model: DataModel) {
    command.execute(model);
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo(model: DataModel) {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    cmd.undo(model);
    this.redoStack.push(cmd);
    return true;
  }

  redo(model: DataModel) {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;
    cmd.execute(model);
    this.undoStack.push(cmd);
    return true;
  }
}
