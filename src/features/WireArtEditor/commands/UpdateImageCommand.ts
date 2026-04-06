import type { Command } from "./Command";
import type { SceneModel } from "../models/SceneModel";
import type { ImageData } from "../models/Image";
import { logWarn } from "../../../utils/error/errorHandler";

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
    if (!img) {
      logWarn("The given Image doesnt exist therefore cant be updated", {
        function: "UpdateImageCommand/execute",
        imageId: this.after.id,
        after: this.after,
      });
      return false;
    }

    this.before = { ...img };
    Object.assign(img, this.after);
    return true;
  }

  undo(model: SceneModel) {
    if (!this.before) {
      logWarn("The Image cant be updated, because it hasnt been updated", {
        function: "UpdateImageCommand/undo",
        imageId: this.after.id,
        after: this.after,
        before: this.before,
      });
      return false;
    }

    const img = model.images.get(this.after.id);
    if (!img) {
      logWarn("The given Image doesnt exist therefore cant be updated", {
        function: "UpdateImageCommand/undo",
        imageId: this.after.id,
      });
      return false;
    }

    Object.assign(img, this.before);
    return true;
  }
}
