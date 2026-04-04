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
  private lastImage: string | null = null;

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

  onClick(): void {
    this.context.gizmoRenderer.setVisible(true);
    this.context.gizmoRenderer.addGizmo({
      id: "1",
      type: "resize",
      pos: new THREE.Vector3(10000, 0, 0),
    });
    this.context.gizmoRenderer.addGizmo({
      id: "2",
      type: "resize",
      pos: new THREE.Vector3(10000, 0, 0),
    });
    this.context.gizmoRenderer.addGizmo({
      id: "3",
      type: "resize",
      pos: new THREE.Vector3(10000, 0, 0),
    });
    this.context.gizmoRenderer.addGizmo({
      id: "4",
      type: "resize",
      pos: new THREE.Vector3(10000, 0, 0),
    });
    this.context.gizmoRenderer.addGizmo({
      id: "5",
      type: "rotate",
      pos: new THREE.Vector3(10000, 0, 0),
    });
  }

  //check for Hit with existing Image
  onPointerDown(event: PointerEvent) {
    this.handleHover(event);
    if (event.button != 0 || !this.lastImage) return; //only move on left click
    this.worldPos.copy(this.context.sceneManager.getWorldPosition(event));

    const handle = this.context.gizmoRenderer.getHovered();
    const data = this.context.model.images.get(this.lastImage);
    if (!data) return;

    if (handle) {
      const type = this.context.gizmoRenderer.getType(handle);
      if (type == "rotate") {
        this.dragMode = "rotate";
      } else {
        this.dragMode = "resize";
      }
    } else {
      this.dragMode = "move";
    }

    this.selectedImage = this.lastImage;
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
    const handle = this.context.gizmoRenderer.getHovered();
    const hoveredImage = this.context.imageRenderer.getHovered();
    if (hoveredImage || handle) {
      this.context.gizmoRenderer.setVisible(true);
      if (!this.lastImage) return;
      const rect = this.context.imageRenderer.getBoundingRect(this.lastImage);
      if (!rect) return;
      this.updateHandles(rect);
    } else {
      this.context.gizmoRenderer.setVisible(handle ? true : false);
    }

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

  updateHandles(rect: {
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    topLeft: { x: number; y: number };
  }) {
    this.context.gizmoRenderer.updateGizmo({
      id: "1",
      type: "resize",
      pos: new THREE.Vector3(rect.topRight.x, rect.topRight.y, 0),
    });
    this.context.gizmoRenderer.updateGizmo({
      id: "2",
      type: "resize",
      pos: new THREE.Vector3(rect.bottomRight.x, rect.bottomRight.y, 0),
    });
    this.context.gizmoRenderer.updateGizmo({
      id: "3",
      type: "resize",
      pos: new THREE.Vector3(rect.bottomLeft.x, rect.bottomLeft.y, 0),
    });
    this.context.gizmoRenderer.updateGizmo({
      id: "4",
      type: "resize",
      pos: new THREE.Vector3(rect.topLeft.x, rect.topLeft.y, 0),
    });
    this.context.gizmoRenderer.updateGizmo({
      id: "5",
      type: "rotate",
      pos: new THREE.Vector3(
        rect.topLeft.x + (rect.topRight.x - rect.topLeft.x) / 2,
        rect.topLeft.y + (rect.topRight.y - rect.topLeft.y) / 2,
        0,
      ),
    });
  }

  unattach(){

  }

  //Enable Hover only for Images
  handleHover(event: PointerEvent) {
    this.context.cursorManager.setCursor(
      this.selectedImage ? "grabbing" : "default",
    );

    if (this.context.gizmoRenderer.handleHover(event)) {
      this.context.imageRenderer.setHovered(null);
      this.context.gizmoRenderer.setVisible(true);
      this.context.cursorManager.setCursor("pointer");
      return;
    }
    if (this.context.imageRenderer.handleHover(event)) {
      this.context.cursorManager.setCursor("pointer");
      this.context.gizmoRenderer.setHovered(null);
      this.context.gizmoRenderer.setVisible(true);
      const img = this.context.imageRenderer.getHovered();
      if (img) {
        const rect = this.context.imageRenderer.getBoundingRect(img);
        this.updateHandles(rect!);
      }

      const hovered = this.context.imageRenderer.getHovered();
      this.lastImage = hovered;
      return;
    }
  }

  dispose(): void {
    this.context.gizmoRenderer.remove("1");
    this.context.gizmoRenderer.remove("2");
    this.context.gizmoRenderer.remove("3");
    this.context.gizmoRenderer.remove("4");
    this.context.gizmoRenderer.remove("5");
    this.context.gizmoRenderer.setVisible(false);
  }
}
