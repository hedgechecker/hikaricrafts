type DragMode = "none" | "move" | "resize" | "rotate";

import * as THREE from "three";
import type { Tool, ToolContext } from "./Tool";
import { UpdateImageCommand } from "../commands/UpdateImageCommand";
import type { ImageData } from "../models/Image";

/**
 * Handles the Transformation of Images supports Scaling, Moving and Rotation
 */
export class TransformTool implements Tool {
  private context: ToolContext;
  private worldPos = new THREE.Vector3();

  private selectedImage: string | null = null;

  private startData: ImageData | null = null;
  private currentData: ImageData = {
    id: "",
    url: "",
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    height: 1,
  };
  private dragOffset = new THREE.Vector2();

  dragMode: DragMode = "none";
  dragging = false;

  constructor(context: ToolContext) {
    this.context = context;
  }

  //check for Hit with existing Image
  onPointerDown(event: PointerEvent) {
    this.handleHover(event);
    if (event.button != 0) return; //only move on left click
    this.worldPos.copy(this.context.sceneManager.getWorldPosition(event));

    const handle = this.context.imageRenderer.getHoveredHandle();
    const hovered = this.context.imageRenderer.getHovered();
    if (!hovered) return;
    const data = this.context.model.images.get(hovered);

    if (!data) return;

    if (handle) {
      if (handle == "rotate") {
        this.dragMode = "rotate";
      } else {
        this.dragMode = "resize";
      }
    } else {
      this.dragMode = "move";
    }

    this.selectedImage = hovered;
    this.startData = data;
    this.currentData = { ...this.startData };

    this.dragging = true;
    this.dragOffset
      .copy(this.worldPos)
      .sub({ x: this.startData.x, y: this.startData.y });

    this.context.imageRenderer.setSelected([this.selectedImage]);
    this.context.sceneManager.setPanEnabled(false);
    this.context.cursorManager.setCursor("grabbing");
  }

  onPointerMove = (event: PointerEvent) => {
    if (this.dragMode == "none") this.handleHover(event);
    if (!this.dragging || !this.selectedImage || !this.startData) return;
    this.worldPos.copy(this.context.sceneManager.getWorldPosition(event));

    // MOVE IMAGE
    if (this.dragMode === "move") {
      this.currentData.x = this.worldPos.x - this.dragOffset.x;
      this.currentData.y = this.worldPos.y - this.dragOffset.y;
      this.context.imageRenderer.updateImage(this.currentData);
    }

    // RESIZE IMAGE
    if (this.dragMode === "resize") {
      const dx = this.worldPos.x - this.startData.x;
      const dy = this.worldPos.y - this.startData.y;

      // transform mouse into image local space
      const cos = Math.cos(-this.startData.rotation);
      const sin = Math.sin(-this.startData.rotation);

      const localY = dx * sin + dy * cos;
      const newHeight = Math.abs(localY) * 2;

      this.currentData.height = newHeight;
      this.context.imageRenderer.updateImage(this.currentData);
      this.context.cursorManager.setCursor("ne-resize");
    }

    //ROTATE IMAGE
    if (this.dragMode === "rotate") {
      const dx = this.worldPos.x - this.startData.x;
      const dy = this.worldPos.y - this.startData.y;
      let angle = Math.atan2(dy, dx);

      //Snap when close to angle
      const snapStep = Math.PI / 4;
      const threshold = 0.05;
      const snapped = Math.round(angle / snapStep) * snapStep;

      if (Math.abs(angle - snapped) < threshold) {
        angle = snapped;
      }

      this.currentData.rotation = angle - Math.PI / 2;

      this.context.imageRenderer.updateImage(this.currentData);
    }
  };

  onPointerUp = (event: PointerEvent) => {
    if (
      this.selectedImage &&
      this.startData &&
      this.startData != this.currentData
    ) {
      this.context.executeCommand(new UpdateImageCommand(this.currentData));
    }

    this.selectedImage = null;
    this.dragging = false;
    this.dragMode = "none";
    this.context.cursorManager.setCursor("default");
    this.context.imageRenderer.setSelected([]);
    this.handleHover(event);
  };

  //Enable Hover only for Images
  handleHover(event: PointerEvent) {
    this.context.imageRenderer.setHovered(null);
    this.context.cursorManager.setCursor(
      this.selectedImage ? "grabbing" : "default",
    );

    if (this.context.imageRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      return;
    }
  }
}
