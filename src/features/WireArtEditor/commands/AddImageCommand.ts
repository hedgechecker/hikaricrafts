import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import type { ImageData } from "../models/Image";
import { logWarn } from "../../../utils/error/errorHandler";
/**
 * Command that adds an Image to the SceneModel.
 */
export class AddImageCommand implements Command {
  private image: ImageData;

  constructor(image: ImageData) {
    this.image = image;
  }

  execute(model: SceneModel) {
    if (model.images.has(this.image.id)) {
      logWarn("Image with this ID already exists", {
        function: "AddImageCommand/execute",
        imageId: this.image.id,
      });
      return false;
    }
    model.images.set(this.image.id, {...this.image});
    return true;
  }

  undo(model: SceneModel) {
    model.images.delete(this.image.id);
    return true;
  }
}
