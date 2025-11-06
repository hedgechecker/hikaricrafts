import * as THREE from "three";
import type { PanelConfig } from "./InterfaceUtils";
import { getGridXYZ, getSceneXY, mergeGroup } from "./MathUtils";
import { createPanelFrame } from "../Objects/Frame";
import { CSG } from "three-csg-ts";
import { itemsById } from "../CanvasThree";
import { threeRefs } from "../ThreeRefs";

import { patternContainer } from "./PatternContainer";

//save the last index
let prevPoint = { x: -10, y: -10, z: -10 };
let userRotation = 0;
var lastX = -10;
var lastY = -10;

export function addClickHandle(
  index: number,
  materialMap: number[],
  config: PanelConfig
) {
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
    patternContainer.removePatternAtCurrent();
  patternContainer.addPattern(index, materialMap, config);
  }  

  threeRefs.renderer.current.domElement.addEventListener("mouseup", onMouseUp);
  threeRefs.renderer.current.domElement.addEventListener("mousedown", onMouseDown);
  return () => {
    threeRefs.renderer.current.domElement.removeEventListener("mouseup", onMouseUp);
    threeRefs.renderer.current.domElement.removeEventListener("mousedown", onMouseDown);
  };
}


export function addKeyBoardInput(config: PanelConfig) {
  const panSpeed = 30;
  const handleKeyDown = (event: KeyboardEvent) => {
    const offset = new THREE.Vector3();
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
      patternContainer.undo();
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "y") {
      patternContainer.redo(config);
      return;
    }

    if (event.key.toLowerCase() === "r") {
      patternContainer.rotatePattern();
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
      default:
        return;
    }

    // Apply the pan to both camera and target (so the scene doesn't rotate)
    threeRefs.camera.current.position.add(offset);
    threeRefs.controls.current.target.add(offset);
    threeRefs.controls.current.update();
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}
/**
 *  Handles the Mouse-Move Event, to preview a Pattern, that snaps to the triangle Grid
 * */
export function addHoverHandle(
  mount: HTMLDivElement,
  config: PanelConfig,
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
  threeRefs.scene.current.remove(threeRefs.pattern.current);
  if (cutpattern) threeRefs.scene.current.remove(cutpattern);

  threeRefs.pattern.current.visible = true;
  threeRefs.scene.current.add(threeRefs.pattern.current);

  function onMouseMove(event: MouseEvent) {
    if (!threeRefs.pattern.current) return;
    const pattern = threeRefs.pattern.current;

    mouse.x =
      ((event.clientX - offsetX) / threeRefs.renderer.current.domElement.clientWidth) * 2 - 1;
    mouse.y =
      -((event.clientY - offsetY) / threeRefs.renderer.current.domElement.clientHeight) * 2 + 1;

    // cast a ray and find the intersection with XY plane
    threeRefs.camera.current.updateMatrix();
    threeRefs.camera.current.updateMatrixWorld();
    raycaster.setFromCamera(mouse, threeRefs.camera.current);

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
      threeRefs.eraser.current == false
    ) {
      if (cutpattern) threeRefs.scene.current.remove(cutpattern);
      const group = mergeGroup(pattern as THREE.Group);
      pattern.visible = false;
      cutpattern = CSG.subtract(group, cuttingTool);
      cutpattern.updateMatrix();
      threeRefs.scene.current.add(cutpattern);
      cutpattern.updateMatrix();
    } else {
      if (cutpattern) {
        threeRefs.scene.current.remove(cutpattern);
      }
      pattern.visible = true;
    }

    prevPoint = relPos;
    patternContainer.prevPoint = relPos;
    patternContainer.prevRotation = scenePos.rotation + patternContainer.userRotation;

  }
  window.addEventListener("mousemove", onMouseMove);

  //cleanup
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    if (threeRefs.pattern.current) threeRefs.scene.current.remove(threeRefs.pattern.current);
    if (cutpattern) threeRefs.scene.current.remove(cutpattern);
  };
}
