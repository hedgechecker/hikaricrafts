import type { Command } from '../models/Command';
import type { DataModel, ImageData } from '../models/DataModel';


export class DeleteImageCommand implements Command {
  private deletedImage: ImageData | null = null;
  private imageId: string;

  constructor(imageId: string) {
    this.imageId = imageId;
  }

  execute(model: DataModel) {
    const image = model.images.get(this.imageId);
    if (!image) return;

    // Backup line
    this.deletedImage = image;

    // Remove line
    model.images.delete(this.imageId);
  }

  undo(model: DataModel) {
    if (!this.deletedImage) return;

    // Restore line
    model.images.set(this.deletedImage.id, { ...this.deletedImage });
  }
}
