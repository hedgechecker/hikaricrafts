import type { Command } from '../models/Command';
import type { DataModel, ImageData } from '../models/DataModel';

/**
 * Command that removes an Image from the DataModel.
 *
 * Does nothing if given Id is invalid
 */
export class DeleteImageCommand implements Command {
  private deletedImage: ImageData | null = null;
  private imageId: string;

  constructor(imageId: string) {
    this.imageId = imageId;
  }

  execute(model: DataModel) {
    const image = model.images.get(this.imageId);
    if (!image) return;

    this.deletedImage = {...image};
    model.images.delete(this.imageId);
  }

  undo(model: DataModel) {
    if (!this.deletedImage) return;
    model.images.set(this.deletedImage.id, { ...this.deletedImage });
  }
}
