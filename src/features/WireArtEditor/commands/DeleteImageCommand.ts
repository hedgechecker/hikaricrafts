import type { Command } from '../models/Command';
import type { SceneModel } from '../models/SceneModel';
import type { ImageData } from '../models/Image';

/**
 * Command that removes an Image from the SceneModel.
 *
 * Does nothing if given Id is invalid
 */
export class DeleteImageCommand implements Command {
  private deletedImage: ImageData | null = null;
  private imageId: string;

  constructor(imageId: string) {
    this.imageId = imageId;
  }

  execute(model: SceneModel) {
    const image = model.images.get(this.imageId);
    if (!image) return;

    this.deletedImage = { ...image };
    model.images.delete(this.imageId);
  }

  undo(model: SceneModel) {
    if (!this.deletedImage) return;
    model.images.set(this.deletedImage.id, { ...this.deletedImage });
  }
}
