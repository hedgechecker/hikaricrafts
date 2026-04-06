import type { SceneModel } from "../models/SceneModel";


export interface Command {
  /**
   * @param model The Source of Truth to be changed
   * @returns if the execution was successfull
   */
  execute(model: SceneModel): boolean;

  /**
   * @param model The Source of Truth to be changed
   * @returns if the undoing was successfull
   */
  undo(model: SceneModel): boolean;
}
