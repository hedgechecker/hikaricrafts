import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

export class MovePointCommand implements Command {
  private id: string;
  private before: { x: number; y: number; z: number };
  private after: { x: number; y: number; z: number };
  constructor(
    id: string,
    before: { x: number; y: number; z: number },
    after: { x: number; y: number; z: number },
  ) {
    this.id = id;
    this.before = before;
    this.after = after;
  }

  execute(model: DataModel) {
    const p = model.points.get(this.id);
    if (!p) return;

    p.x = this.after.x;
    p.y = this.after.y;
    p.z = this.after.z;
  }

  undo(model: DataModel) {
    const p = model.points.get(this.id);
    if (!p) return;

    p.x = this.before.x;
    p.y = this.before.y;
    p.z = this.before.z;
  }
}
