// PatternContainer.ts
import * as THREE from "three";
import type { gridPosition, PanelConfig, singlePattern } from "./InterfaceUtils";
import { getSceneXY, mergeGroup, parseXYZ } from "./MathUtils";
import { createPanelFrame } from "../Objects/Frame";
import { CSG } from "three-csg-ts";
import { createPattern } from "../Objects/CanvasPatterns";
import { load, loadKeyValue, remove, save, saveKeyValue } from "./StorageUtils";
import { itemsById } from "../CanvasThree";
import { threeRefs } from "../ThreeRefs";
import { useAppStore } from "../../../store/useAppStore";

/**
 * PatternContainer centralizes all pattern-related state:
 * - Pattern creation, removal, undo/redo, and rotation.
 * - Tracks grid position, rotation, and interaction history.
 */
interface UndoAction {
  type: "add" | "remove" | "replace";
  id: string;
  pattern: singlePattern;
}

export class PatternContainer {
  prevPoint: gridPosition = { x: -10, y: -10, z: -10 };
  prevRotation = -10;
  userRotation = 0;

  lastMousePosX = 0;
  lastMousePosY = 0;

  undoStack: UndoAction[] = [];
  redoStack: UndoAction[] = [];

  currConfiguration = 0;
  configurationStack: { materialmap: number[]; index:number}[] = [];

  public constructor(test:number){
    if(test){}
    var value = loadKeyValue("configurations");
    if(!value)return;
    this.configurationStack = value;
    this.currConfiguration = 1;
    this.moveDownPattern();
  }
  /**
   * Creates a new pattern at the current grid position
   */
  addPattern(index: number, materialMap: number[], rotation?: number) {
    const pid = this.getId(this.prevPoint);
    const pItem = itemsById.get(pid);
    if(pItem){
      if(index === 0){
        this.removePattern(this.prevPoint, true);
        return;
      }else{
        const pattern = {
          rotation: rotation? rotation :this.prevRotation+ this.userRotation,
          materialMap: [...materialMap],
          patternIndex: index,
        };
        const action = this.replacePattern(this.prevPoint, pattern);
        if(action){this.undoStack.push(action);
          this.redoStack = [];
        }
        return;
      }
    };
    if (index === 0 || this.prevPoint.x < 0) return;

    const pattern: singlePattern = {
      rotation: (rotation)? rotation :  this.prevRotation + this.userRotation,
      patternIndex: index,
      materialMap: [...materialMap],
    };
    
    const existingIndex = this.configurationStack.findIndex(
      (el) =>
        el.index === index &&
        JSON.stringify(el.materialmap) === JSON.stringify(materialMap)
    );
    // If it exists, remove it from current position
    if (existingIndex !== -1) {
      this.configurationStack.splice(existingIndex, 1);
    }
    // Push it to the *top* (front) of the stack
    this.configurationStack.unshift({materialmap: [...materialMap], index:index});
    if (this.configurationStack.length > 10) {
      this.configurationStack.length = 10;
    }
    
    this.currConfiguration = 0;
    console.log(this.configurationStack);
    saveKeyValue("configurations", this.configurationStack);

    // Save to persistent storage
    save(this.prevPoint, pattern);

    const { panelSize } = useAppStore.getState();
    const id = this.getId(this.prevPoint);
    const item = this._createThreeObject(this.prevPoint, pattern, panelSize);

    itemsById.set(id, item);
    threeRefs.scene.current.add(item);

    // Register for undo
    this.undoStack.push({
      type: "add",
      id : id,
      pattern: pattern
    });

    this.redoStack = []; // clear redo on new action
  }

  /**
   * Removes a pattern from the scene and saves it to redo stack (if undo)
   */
  removePattern(point: gridPosition, undoEntry: boolean = true) {
    const id = this.getId(point);
    const item = itemsById.get(id);
    if(!item)return;
    const pattern = load(id) as singlePattern; 
    // Push undo info
    if(undoEntry){
      this.undoStack.push({
      type: "remove",
      id,
      pattern,
      });
      this.redoStack = [];
    }
    
    threeRefs.scene.current.remove(item);
    itemsById.delete(id);
    remove(point);
  }

  replacePattern(point: gridPosition, newPattern: singlePattern ){
    const id = this.getId(point);
    const existingItem = itemsById.get(id);
    if(!existingItem)return;

    const oldPattern = load(id) as singlePattern;
    if (!oldPattern) return;

    threeRefs.scene.current.remove(existingItem);
    itemsById.delete(id);
    remove(point);

    const { panelSize } = useAppStore.getState();
    const newItem = this._createThreeObject(point, newPattern, panelSize);
    itemsById.set(id, newItem);
    threeRefs.scene.current.add(newItem);

    // Save new pattern to storage
    save(point, newPattern);
    return {
      type: "replace",
      id,
      pattern: oldPattern,} as UndoAction;
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
    this.userRotation = 0;

    const point = parseXYZ(last.id) as gridPosition;  
    const { panelSize } = useAppStore.getState();

    if(last.type === "add"){
      this.removePattern(point, false);
      this.redoStack.push(last);
    }else if(last.type === "remove"){
      const item = this._createThreeObject(point, last.pattern, panelSize);
      itemsById.set(last.id, item);
      threeRefs.scene.current.add(item);
      save(point,last.pattern);
      this.redoStack.push(last);
    }else if(last.type === "replace"){
      const action = 
      this.replacePattern(point, last.pattern);
      if(action){
        this.redoStack.push(action);
      }
    }

  }

  /**
   * Redo the last undone action
   */
  redo() {
    console.log("REDO ACHTION");
    if (this.redoStack.length === 0) return;
    const last = this.redoStack.pop();
    if (!last) return;
    this.userRotation = 0;

    const point = parseXYZ(last.id) as gridPosition;
    const { panelSize } = useAppStore.getState();
    if(last.type === "add"){
      const item = this._createThreeObject(point, last.pattern,panelSize);
      itemsById.set(last.id, item);
      threeRefs.scene.current.add(item);
      save(point,last.pattern);
      this.undoStack.push(last);
    }else if(last.type === "remove"){
      this.removePattern(point, false);
      this.undoStack.push(last);
    }else if(last.type === "replace"){
      const action = 
      this.replacePattern(point, last.pattern);
      if(action){
        this.undoStack.push(action);
      }
    }

  }

  /**
   * Rotate pattern (R key handler)
   */
  rotatePattern() {
    this.userRotation = (this.userRotation - 2) % 6;
    this.updatePanel();
  }

  /**
   * Internal helper: Create a pattern THREE.Object3D (handles cutting if on border)
   */
  private _createThreeObject(point: gridPosition, pattern: singlePattern, config: PanelConfig) {
    const scenePos = getSceneXY(point, config);
    const item = createPattern(pattern.patternIndex, config, false, [...pattern.materialMap]);
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
  }

  moveDownPattern(){
    if(this.currConfiguration <= 0)return;
    const  {setMaterialMap, setPatternIndex }= useAppStore.getState();
    this.currConfiguration--;
    setMaterialMap([...this.configurationStack[this.currConfiguration].materialmap]);
    setPatternIndex(this.configurationStack[this.currConfiguration].index);
    this.updatePanel();
  }

  moveUpPattern(){
    if(this.currConfiguration >= this.configurationStack.length -1)return;
    const  {setMaterialMap, setPatternIndex }= useAppStore.getState();
    this.currConfiguration ++;
    setMaterialMap([...this.configurationStack[this.currConfiguration].materialmap]);
    setPatternIndex(this.configurationStack[this.currConfiguration].index);
    this.updatePanel();
  } 

  updatePanel(){
    this.prevPoint = { x: -10, y: -10, z: -10 };
    const ev = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: this.lastMousePosX,
      clientY: this.lastMousePosY,
    });
    window.dispatchEvent(ev);
  }
}


export const patternContainer = new PatternContainer(1);
