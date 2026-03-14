import type { SceneModel } from "../models/SceneModel";


export interface Command {
  execute(model: SceneModel): void;
  undo(model: SceneModel): void;
}
