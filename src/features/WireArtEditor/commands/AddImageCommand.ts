import type { Command } from '../models/Command';
import type { DataModel, ImageData } from '../models/DataModel';
/**
 * Command that adds an Image to the DataModel.
 *
 * Constraints: none
 */
export class AddImageCommand implements Command {
  private image: ImageData;

  constructor(image: ImageData) {
    this.image = image;
  }

  execute(model: DataModel) {
    model.images.set(this.image.id, this.image);
  }

  undo(model: DataModel) {
    model.images.delete(this.image.id);
  }
}
