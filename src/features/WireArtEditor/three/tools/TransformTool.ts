type DragMode = 'none' | 'move' | 'resize';

import * as THREE from 'three';
import type { BackgroundImage } from '../objects/BackgroundImage';
import type { Tool } from './Tool';
import type { ThreeEditor } from '../ThreeEditor';
import type { CursorManager } from '../objects/CursorManager';
import { UpdateImageCommand } from '../../commands/UpdateImageCommand';
import type { SceneManager } from '../SceneManager';
import type { ImageData } from '../../models/DataModel';

export class TransformTool implements Tool {
  dragMode: DragMode = 'none';
  activeHandle?: THREE.Object3D;
  dragging = false;

  private editor: ThreeEditor;
  private sceneManager: SceneManager;
  private cursorManager: CursorManager;
  private selectedImage: BackgroundImage | null = null;
  private selectedId: string | null = null;

  private mouse = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5);

  private startData: ImageData | null = null;
  private currentData: ImageData = {
    id: '',
    url: '',
    x: 0,
    y: 0,
    rotation: 0,
    height: 1,
  };
  private dragOffset = new THREE.Vector3();

  constructor(cursorManager: CursorManager, editor: ThreeEditor, sceneManager: SceneManager) {
    this.editor = editor;
    this.cursorManager = cursorManager;
    this.sceneManager = sceneManager;
  }

  onMouseDown = (event: MouseEvent) => {
    if (event.button != 0) return; //only move on left click
    this.handleHover(event);
    this.selectedId = this.sceneManager.getHoveredImage();
    console.log(this.selectedId);
    if (!this.selectedId) {
      this.sceneManager.gizmo.group.visible = false;
      return;
    }
    this.selectedImage = this.sceneManager.getImage(this.selectedId);
    if (!this.selectedImage) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    this.startData = {
      ...this.selectedImage.data,
      url: '',
    };
    this.currentData = {
      ...this.selectedImage.data,
      url: '',
    };
    // check handles first
    const handleHits = this.raycaster.intersectObjects(this.sceneManager.gizmo.handles, true);
    if (handleHits.length) {
      this.dragMode = 'resize';
      this.activeHandle = handleHits[0].object;
      this.dragging = true;
      return;
    }

    const pos = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(this.dragPlane, pos)) {
      this.dragMode = 'move';
      this.dragging = true;

      this.dragOffset.copy(pos).sub(this.selectedImage.mesh.position);
    }
  };

  onMouseMove = (event: MouseEvent) => {
    this.handleHover(event);
    if (!this.dragging || !this.selectedImage) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const pos = new THREE.Vector3();

    if (!this.raycaster.ray.intersectPlane(this.dragPlane, pos)) return;

    // MOVE IMAGE
    if (this.dragMode === 'move') {
      this.selectedImage.mesh.position.copy(pos.clone().sub(this.dragOffset));
      this.currentData.x = this.selectedImage.mesh.position.x;
      this.currentData.y = this.selectedImage.mesh.position.y;
    }

    // RESIZE IMAGE
    if (this.dragMode === 'resize') {
      const center = this.selectedImage.mesh.position;
      const newHeight = Math.abs(pos.y - center.y) * 2;
      this.selectedImage.setHeight(newHeight);
      this.currentData.height = newHeight;
      this.cursorManager.setCursor('ne-resize');
    }

    this.sceneManager.gizmo.update(this.selectedImage);
  };

  onMouseUp = () => {
    if (!this.selectedId || !this.startData || this.startData == this.currentData) {
      console.log('missin');
      this.selectedId = null;
      this.dragging = false;
      this.dragMode = 'none';
      this.activeHandle = undefined;
      this.cursorManager.setCursor('default');
      return;
    }

    this.editor.executeCommand(new UpdateImageCommand(this.currentData));
    this.selectedId = null;
    this.dragging = false;
    this.dragMode = 'none';
    this.activeHandle = undefined;
  };

  updateMouse(event: MouseEvent) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  handleHover(event: MouseEvent) {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const imageHits = this.raycaster.intersectObjects(this.sceneManager.getImageHitboxes(), false);
    const hoveredImage = this.sceneManager.getFirstHoverableImage(imageHits);
    if (hoveredImage) {
      this.sceneManager.setHoveredImage(hoveredImage);
      this.cursorManager.setCursor('move');
      return;
    }
    const handleHits = this.raycaster.intersectObjects(this.sceneManager.gizmo.getHitboxes(), true);

    if (handleHits.length) {
      this.cursorManager.setCursor('ne-resize');

      return;
    }
    this.sceneManager.setHoveredImage(null);
    this.cursorManager.setCursor('default');
  }
}
