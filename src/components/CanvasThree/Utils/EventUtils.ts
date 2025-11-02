import * as THREE from "three";
import type { PanelConfig } from "./InterfaceUtils";
import { getGridXYZ, getSceneXY, mergeGroup } from "./MathUtils";
import { createPanelFrame } from "../Objects/Frame";
import { CSG } from "three-csg-ts";
import { remove, save } from "./StorageUtils";
import { createPattern } from "../Objects/CanvasPatterns";
import { itemsById } from "../CanvasThree";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//save the last index
let prevPoint = { x: -10, y: -10, z: -10 };
let prevRotation = -10;
let userRotation = 0;
var lastX = -10;
var lastY = -10;
var lastMousePosX = 0;
var lastMousePosY = 0;
const lastPatterns = new Map<number, string>();
var PatternCount = 0;

export function addClickHandle(
  renderer: THREE.WebGLRenderer,
  index: number,
  materialMap: number[],
  scene: THREE.Scene,
  config: PanelConfig
) {
  const pattern = {
    rotation: prevRotation,
    patternIndex: index,
    materialMap: materialMap,
  };
  const cuttingTool = createPanelFrame({
    width: config.width + 20000,
    height: config.height + 20000,
    depth: 200,
    frameWidth: 10000 + config.frameWidth,
    lineWidth: 0,
    spacing: 0,
  });
  cuttingTool.updateMatrix();
  function onMouseDown(event: MouseEvent) {
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function onMouseUp(event: MouseEvent) {
    if (
      Math.abs(event.clientX - lastX) > 2 ||
      Math.abs(event.clientY - lastY) > 2
    ) {
      return;
    }
    removeItem("X" + prevPoint.x + "Y" + prevPoint.y + "Z" + prevPoint.z);
    //eraser => dont add another pattern
    if (index == 0) {
      return;
    }
    pattern.rotation = prevRotation;
    if(prevPoint.x <0){
      return;
    }
    save(prevPoint, pattern);
    console.log("Clicked" + JSON.stringify(prevPoint));

    const scenePos = getSceneXY(prevPoint, config);
    const item = createPattern(index, config, false, materialMap);
    item.position.copy(scenePos.pos);
    item.rotation.z = (Math.PI / 3) * prevRotation;
    item.updateMatrix();
    

    if (
      (scenePos.pos.x <= -config.width / 2 + config.spacing ||
        scenePos.pos.x >= config.width / 2 - config.spacing ||
        scenePos.pos.y <= -config.height / 2 + config.spacing)
    ) {
      const group = mergeGroup(item as THREE.Group);
      const cutpattern = CSG.subtract(group, cuttingTool);
      cutpattern.updateMatrix();
      scene.add(cutpattern);
      itemsById.set(
      "X" + prevPoint.x + "Y" + prevPoint.y + "Z" + prevPoint.z,
      cutpattern
    );
    } else {
      scene.add(item);
      itemsById.set(
      "X" + prevPoint.x + "Y" + prevPoint.y + "Z" + prevPoint.z,
      item
    );
    }
    lastPatterns.set(PatternCount, "X" + prevPoint.x + "Y" + prevPoint.y + "Z" + prevPoint.z);
    PatternCount++;
  }
  function removeItem(id: string) {
    const item = itemsById.get(id);
    if (item) {
      scene.remove(item);
      itemsById.delete(id);
      remove(prevPoint);
    }
  }

  renderer.domElement.addEventListener("mouseup", onMouseUp);
  renderer.domElement.addEventListener("mousedown", onMouseDown);
  return () => {
    renderer.domElement.removeEventListener("mouseup", onMouseUp);
    renderer.domElement.removeEventListener("mousedown", onMouseDown);
  };
}

/**
 *  Handles the Mouse-Move Event, to preview a Pattern, that snaps to the triangle Grid
 * @param camera the THREE.Camera Object of the scene
 * @param renderer
 * @param scene
 * @param mount
 * @param config //Dimensions to calculate Snapping Points on the Grid
 * @param patternIndex Index of the currently previewed Pattern
 * @returns
 *
 */
export function addHoverHandle(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  mount: HTMLDivElement,
  config: PanelConfig,
  patternRef: React.RefObject<THREE.Object3D>,
  eraserRef: React.RefObject<boolean>
) {
  //
  var cutpattern: THREE.Object3D | null = null;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let offsetX = 0;
  let offsetY = 0;
  //used to perform the cutting action on the different grid types
  const cuttingTool = createPanelFrame({
    width: config.width + 20000,
    height: config.height + 20000,
    depth: 200,
    frameWidth: 10000,
    lineWidth: 0,
    spacing: 0,
  });
  cuttingTool.updateMatrix();

  if (mount) {
    const rect = mount.getBoundingClientRect();
    offsetX = rect.x;
    offsetY = rect.y;
  }

  //remove previous Patterns
  if (patternRef.current) scene.remove(patternRef.current);
  if (cutpattern) scene.remove(cutpattern);

  patternRef.current.visible = true;
  scene.add(patternRef.current);

  function onMouseMove(event: MouseEvent) {
    lastMousePosX = event.x;
    lastMousePosY = event.y;
    if (!patternRef.current) return;
    const pattern = patternRef.current;

    mouse.x =
      ((event.clientX - offsetX) / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y =
      -((event.clientY - offsetY) / renderer.domElement.clientHeight) * 2 + 1;

    // cast a ray and find the intersection with XY plane
    camera.updateMatrix();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);

    const planeGeometry = new THREE.PlaneGeometry(
      config.width - 2 * config.frameWidth,
      config.height - 2 * config.frameWidth
    );
    const planeMaterial = new THREE.MeshBasicMaterial({
      visible: false, // invisible, but still works for raycasting
      side: THREE.DoubleSide,
    });
    const placementPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    const intersects = raycaster.intersectObject(placementPlane);
    //when the mouse is not over the grid
    if (intersects.length <= 0) {
      pattern.visible = false;
      if (cutpattern) cutpattern.visible = false;
      return;
    }

    const point = intersects[0].point;
    const relPos = getGridXYZ(point.x, point.y, config);

    //When still over the same Cell, we dont need to update anything
    if (
      prevPoint.x === relPos.x &&
      prevPoint.y === relPos.y &&
      prevPoint.z === relPos.z
    ) {
      return;
    }

    const scenePos = getSceneXY(relPos, config);
    pattern.position.copy(scenePos.pos);
    pattern.rotation.z = (Math.PI / 3) * (scenePos.rotation + userRotation);
    prevRotation = scenePos.rotation + userRotation;

    const prevItem = itemsById.get(
      "X" + prevPoint.x + "Y" + prevPoint.y + "Z" + prevPoint.z
    );
    if (prevItem) {
      prevItem.visible = true;
    }
    const item = itemsById.get(
      "X" + relPos.x + "Y" + relPos.y + "Z" + relPos.z
    );
    if (item) {
      item.visible = false;
    }

    //only perform cutting, if the pattern is on the perimeter of the Grid
    if (
      (scenePos.pos.x <= -config.width / 2 + config.spacing ||
        scenePos.pos.x >= config.width / 2 - config.spacing ||
        scenePos.pos.y <= -config.height / 2 + config.spacing) &&
      eraserRef.current == false
    ) {
      if (cutpattern) scene.remove(cutpattern);
      const group = mergeGroup(pattern as THREE.Group);
      pattern.visible = false;
      cutpattern = CSG.subtract(group, cuttingTool);
      cutpattern.updateMatrix();
      scene.add(cutpattern);
      cutpattern.updateMatrix();
    } else {
      if (cutpattern) {
        scene.remove(cutpattern);
      }
      pattern.visible = true;
    }

    prevPoint = relPos;
  }
  window.addEventListener("mousemove", onMouseMove);

  //cleanup
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    if (patternRef.current) scene.remove(patternRef.current);
    if (cutpattern) scene.remove(cutpattern);
  };
}

export //Add movement throug the arrow keys
const panSpeed = 30;
export function addKeyBoardInput(
  camera: THREE.Camera,
  controls: OrbitControls
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    const offset = new THREE.Vector3();

    if (event.ctrlKey && event.key.toLowerCase() === "z" && PatternCount > 0) {
      console.log("Undo action (Ctrl+Z)");
      console.log("PATERN "+ lastPatterns.get(--PatternCount));
      //remove(lastPatterns.get(PatternCount) as string);
      //removeItem(lastPatterns.get(PatternCount) as string);
    return; // Stop further handling
  }

  if (event.ctrlKey && event.key.toLowerCase() === "y") {
    console.log("Redo action (Ctrl+Y)");

    return;
  }

    switch (event.key.toLowerCase()) {
      case "w":
        offset.set(0, panSpeed, 0);
        break;
      case "s":
        offset.set(0, -panSpeed, 0);
        break;
      case "a":
        offset.set(-panSpeed, 0, 0);
        break;
      case "d":
        offset.set(panSpeed, 0, 0);
        break;
      case "r":
        userRotation -= 2;
        userRotation %= 6;
        console.log(userRotation);
        prevPoint = { x: -10, y: -10, z: -10 };
        const eve = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    clientX: lastMousePosX, // X coordinate
    clientY: lastMousePosY, // Y coordinate
  });
        window.dispatchEvent(eve);
        break;
      default:
        return;
    }

    if (!camera || !controls) return;
    // Apply the pan to both camera and target (so the scene doesn't rotate)
    camera.position.add(offset);
    controls.target.add(offset);
    controls.update();
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}
