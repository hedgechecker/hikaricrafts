import type { DataModel } from './DataModel';

export interface Command {
  execute(model: DataModel): void;
  undo(model: DataModel): void;
}
