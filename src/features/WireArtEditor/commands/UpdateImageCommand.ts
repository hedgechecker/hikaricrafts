import type { Command } from './Command';
import type { SceneModel } from '../models/SceneModel';
import type { ImageData } from '../models/Image';

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

  execute(model: SceneModel) {
    const img = model.images.get(this.after.id);
    if (!img) return;

    this.before = { ...img };
    Object.assign(img, this.after);
  }

  undo(model: SceneModel) {
    if (!this.before) return;

    const img = model.images.get(this.after.id);
    if (!img) return;

    Object.assign(img, this.before);
  }
}
