import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { getMaterial } from "./Materials";
import type { PanelConfig } from "../Utils/InterfaceUtils";


/** Creates a Frame with size (width x height) and a thickness of (framewidth), the framewidth is built inwards,
 * so the total size of the frame stays (width x height)
 * @param height the height of the frame
 * @param width the width of the frame
 * @param depth the depth of the frame
 * @param frameWidth the outside width
 * @returns THREE.Mesh
 */
export function createPanelFrame(
  config: PanelConfig
) {
  //the frame gets created with a smaller rectangle cut out from a bigger rectangle
  const outerGeometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
  const innerGeometry = new THREE.BoxGeometry(
    config.width - 2 * config.frameWidth,
    config.height - 2 * config.frameWidth,
    config.depth
  );

  const outerMesh = new THREE.Mesh(outerGeometry);
  const innerMesh = new THREE.Mesh(innerGeometry);
  //subtract the meshes
  const frameMesh = CSG.subtract(outerMesh, innerMesh);

  frameMesh.material = getMaterial(0);

  return frameMesh;
}
