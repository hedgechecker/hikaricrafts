import type { Command } from '../models/Command';
import type { DataModel, ImageData } from '../models/DataModel';

/**
 * Command that updates an existing Image
 *
 * Does nothing if given Id is Invalid
 */
export class UpdateImageCommand implements Command {
  private before?: ImageData;
  private after: ImageData;

  constructor(data: ImageData) {
    this.after = data;
  }

  execute(model: DataModel) {
    const img = model.images.get(this.after.id);
    if (!img) return;

    this.before = {...img};

    img.x = this.after.x;
    img.y = this.after.y;
    img.rotation = this.after.rotation;
    img.height = this.after.height;
  }

  undo(model: DataModel) {
    if(!this.before)return;
    
    const img = model.images.get(this.after.id);
    if (!img) return;

    img.x = this.before.x;
    img.y = this.before.y;
    img.rotation = this.before.rotation;
    img.height = this.before.height;
  }
}
