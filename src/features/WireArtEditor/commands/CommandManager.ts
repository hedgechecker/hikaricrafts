import type { Command } from './Command';
import type { SceneModel } from '../models/SceneModel';

/**
 * Handles the Execution of Commands
 * Adds the ability to undo/redo Commands
 */
export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  /**
   * Executes a given Command and remebers it
   * @param command The Command to be executed
   * @param model The Source of truth
   */
  execute(command: Command, model: SceneModel): void {
    command.execute(model);
    this.undoStack.push(command);
    this.redoStack = [];
  }

  /**
   * Undoes the last Command, if it exists
   * @param model The Source of truth
   * @returns if Undoing was successfull
   */
  undo(model: SceneModel): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo(model);
    this.redoStack.push(cmd);
    return true;
  }

  /**
   * Redoes the last Command, if it exists
   * @param model The Source of truth
   * @returns if Redoing was successfull
   */
  redo(model: SceneModel): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute(model);
    this.undoStack.push(cmd);
    return true;
  }
}
