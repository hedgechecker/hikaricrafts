import type { SceneModel } from './SceneModel';

export interface Command {
  execute(model: SceneModel): void;
  undo(model: SceneModel): void;
}
