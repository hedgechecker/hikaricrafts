import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";

/**
 * Handles the Execution of Commands
 * Adds the ability to undo/redo Commands
 */
export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistory = 100;

  /**
   * Executes a given Command and remembers it
   * @param command The Command to be executed
   * @param model The Source of truth
   */
  execute(command: Command, model: SceneModel): boolean {
    const result = command.execute(model);
    if (!result) return false;

    this.undoStack.push(command);
    this.trimStack(this.undoStack);
    this.redoStack = [];
    return true;
  }

  /**
   * Undoes the last Command, if it exists
   * @param model The Source of truth
   * @returns if Undoing was successfull
   */
  undo(model: SceneModel): boolean {
    const cmd = this.undoStack[this.undoStack.length - 1];
    if (!cmd) return false;

    const result = cmd.undo(model);
    if (!result) return false;

    this.undoStack.pop();
    this.redoStack.push(cmd);
    return true;
  }

  /**
   * Redoes the last Command, if it exists
   * @param model The Source of truth
   * @returns if Redoing was successfull
   */
  redo(model: SceneModel): boolean {
    const cmd = this.redoStack[this.undoStack.length - 1];
    if (!cmd) return false;

    const result = cmd.execute(model);
    if (!result) return false;

    this.redoStack.pop();
    this.undoStack.push(cmd);
    return true;
  }

  /**
   * makes sure the current stack gets trimmed to the maxLength
   * @param stack the Command Stack
   */
  private trimStack(stack: Command[]) {
    if (stack.length > this.maxHistory) {
      stack.shift();
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
