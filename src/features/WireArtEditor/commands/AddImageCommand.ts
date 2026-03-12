import type { Command } from '../models/Command';
import type { SceneModel } from '../models/SceneModel';
import type { ImageData } from '../models/Image';
/**
 * Command that adds an Image to the SceneModel.
 *
 * Constraints: none
 */
export class AddImageCommand implements Command {
  private image: ImageData;

  constructor(image: ImageData) {
    this.image = image;
  }

  execute(model: SceneModel) {
    model.images.set(this.image.id, this.image);
  }

  undo(model: SceneModel) {
    model.images.delete(this.image.id);
  }
}
