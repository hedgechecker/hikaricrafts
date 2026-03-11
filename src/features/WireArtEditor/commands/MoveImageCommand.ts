import type { Command } from '../models/Command';
import type { DataModel } from '../models/DataModel';

export class MoveImageCommand implements Command {
  private id: string;
  private before: { x: number; y: number; rotation: number; height: number };
  private after: { x: number; y: number; rotation: number; height: number };
  constructor(
    id: string,
    before: { x: number; y: number; rotation: number; height: number; },
    after: { x: number; y: number; rotation: number; height: number; },
  ) {
    this.id = id;
    this.before = before;
    this.after = after;
  }

  execute(model: DataModel) {
    const img = model.images.get(this.id);
    if (!img) return;

    img.x = this.after.x;
    img.y = this.after.y;
    img.rotation = this.after.rotation;
    img.height = this.after.height;
  }

  undo(model: DataModel) {
    const img = model.images.get(this.id);
    if (!img) return;

    img.x = this.before.x;
    img.y = this.before.y;
    img.rotation = this.before.rotation;
    img.height = this.before.height;
  }
}
