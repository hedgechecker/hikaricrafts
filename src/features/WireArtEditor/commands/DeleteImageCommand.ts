import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import type { ImageData } from "../models/Image";
import { logWarn } from "../../../utils/error/errorHandler";

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
    if (!image) {
      logWarn("The given Image doesnt exist therefore cant be deleted", {
        function: "DeleteImageCommand/execute",
        imageId: this.imageId,
      });
      return false;
    }

    this.deletedImage = { ...image };
    model.images.delete(this.imageId);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.deletedImage) {
      logWarn("The Image cant be restored, because it hasnt been deleted", {
        function: "DeleteImageCommand/undo",
        imageId: this.imageId,
      });
      return false;
    }
    model.images.set(this.deletedImage.id, { ...this.deletedImage });
    return true;
  }
}
