// PatternContainer.ts
import * as THREE from "three";
import type { gridPosition, PanelConfig, singlePattern } from "./InterfaceUtils";
import { getSceneXY, mergeGroup, parseXYZ } from "./MathUtils";
import { createPanelFrame } from "../Objects/Frame";
import { CSG } from "three-csg-ts";
import { createPattern } from "../Objects/CanvasPatterns";
import { remove, save } from "./StorageUtils";
import { itemsById } from "../CanvasThree";
import { threeRefs } from "../ThreeRefs";

/**
 * PatternContainer centralizes all pattern-related state:
 * - Pattern creation, removal, undo/redo, and rotation.
 * - Tracks grid position, rotation, and interaction history.
 */
export class PatternContainer {
  prevPoint: gridPosition = { x: -10, y: -10, z: -10 };
  prevRotation = -10;
  userRotation = 0;

  lastMousePosX = 0;
  lastMousePosY = 0;

  undoStack: { id: string; config: singlePattern }[] = [];
  redoStack: { id: string; config: singlePattern }[] = [];

  patternCount = 0;
  maxPatternCount = 0;

  /**
   * Creates a new pattern at the current grid position
   */
  addPattern(index: number, materialMap: number[], config: PanelConfig) {
    if (index === 0 || this.prevPoint.x < 0) return;

    const pattern: singlePattern = {
      rotation: this.prevRotation,
      patternIndex: index,
      materialMap,
    };

    // Save to persistent storage
    save(this.prevPoint, pattern);

    const id = this.getId(this.prevPoint);
    const item = this._createThreeObject(this.prevPoint, pattern, config);

    itemsById.set(id, item);
    threeRefs.scene.current.add(item);

    // Register for undo
    this.undoStack.push({ id, config: pattern });
    this.redoStack = []; // clear redo on new action
    this.patternCount++;
    this.maxPatternCount = Math.max(this.maxPatternCount, this.patternCount);
  }

  /**
   * Removes a pattern from the scene and saves it to redo stack (if undo)
   */
  removePattern(point: gridPosition) {
    const id = this.getId(point);
    const item = itemsById.get(id);
    if (item) {
      // get current pattern config if available

      threeRefs.scene.current.remove(item);
      itemsById.delete(id);
      remove(point);
    }
  }

  /** Removes pattern at current hover/click position */
  removePatternAtCurrent() {
    this.removePattern(this.prevPoint);
  }

  /**
   * Undo the most recent add action
   */
  undo() {
    if (this.undoStack.length === 0) return;
    const last = this.undoStack.pop();
    if (!last) return;

    const point = parseXYZ(last.id) as gridPosition;
    this.removePattern(point);
    this.redoStack.push(last);
    this.patternCount--;
  }

  /**
   * Redo the last undone action
   */
  redo(config?: PanelConfig) {
    console.log("REDO ACHTION");
    if (this.redoStack.length === 0 || !config) return;
    const entry = this.redoStack.pop();
    if (!entry) return;

    const point = parseXYZ(entry.id) as gridPosition;
    this.prevPoint = point;
    this.prevRotation = entry.config.rotation;

    // Recreate the pattern
    const item = this._createThreeObject(point, entry.config, config);
    itemsById.set(entry.id, item);
    threeRefs.scene.current.add(item);
    save(point, entry.config);

    this.undoStack.push(entry);
    this.patternCount++;
  }

  /**
   * Rotate pattern (R key handler)
   */
  rotatePattern() {
    this.userRotation = (this.userRotation - 2 + 6) % 6;
    this.prevPoint = { x: -10, y: -10, z: -10 };
    const ev = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: this.lastMousePosX,
      clientY: this.lastMousePosY,
    });
    window.dispatchEvent(ev);
  }

  /**
   * Internal helper: Create a pattern THREE.Object3D (handles cutting if on border)
   */
  private _createThreeObject(point: gridPosition, pattern: singlePattern, config: PanelConfig) {
    const scenePos = getSceneXY(point, config);
    const item = createPattern(pattern.patternIndex, config, false, pattern.materialMap);
    item.position.copy(scenePos.pos);
    item.rotation.z = (Math.PI / 3) * pattern.rotation;
    item.updateMatrix();

    const cuttingTool = createPanelFrame({
      width: config.width + 20000,
      height: config.height + 20000,
      depth: 200,
      frameWidth: 10000 + config.frameWidth,
      lineWidth: 0,
      spacing: 0,
    });
    cuttingTool.updateMatrix();

    // apply border clipping if needed
    if (
      scenePos.pos.x <= -config.width / 2 + config.spacing ||
      scenePos.pos.x >= config.width / 2 - config.spacing ||
      scenePos.pos.y <= -config.height / 2 + config.spacing
    ) {
      const group = mergeGroup(item as THREE.Group);
      const cutPattern = CSG.subtract(group, cuttingTool);
      cutPattern.updateMatrix();
      return cutPattern;
    }
    return item;
  }

  /** Convert grid position to unique ID string */
  getId(point: gridPosition) {
    return `X${point.x}Y${point.y}Z${point.z}`;
  }

  /** Reset entire container */
  reset() {
    this.prevPoint = { x: -10, y: -10, z: -10 };
    this.prevRotation = -10;
    this.userRotation = 0;
    this.lastMousePosX = 0;
    this.lastMousePosY = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.patternCount = 0;
    this.maxPatternCount = 0;
  }
}

export const patternContainer = new PatternContainer();
