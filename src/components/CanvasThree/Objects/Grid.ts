import { createPanelFrame } from "./Frame";
import { getFastMaterial } from "./Materials";
import { CSG } from "three-csg-ts";
import { distanceBetweenParallels, isZnegative } from "../Utils/MathUtils";
import * as THREE from "three";
import type { PanelConfig } from "../Utils/InterfaceUtils";

/**
 * Creates a Triangle-grid Pattern in the given size, the grid is oriented on the top left corner
 * @param height height of the frame
 * @param width width of the frame
 * @param depth depth of the grid
 * @param frameWidth width of the frame around the grid
 * @param spacing length of one of the triangle sides
 * @returns THREE.Mesh
 */
export function createGrid(config: PanelConfig) {
  const material = getFastMaterial(0);
  const height = config.height - 2 * config.frameWidth;
  const width = config.width - 2 * config.frameWidth;
  //--------------------Constants --------------------
  //height of the equilateral triangles
  const triangleHeight = Math.sqrt(
    config.spacing * config.spacing -
      ((config.spacing / 2) * config.spacing) / 2
  );
  //Maximum needed height between the diagonal lines
  const diagonal =
    (Math.max(width, height) * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 4);
  //c = b × sin gamma / sin beta
  const sideC =
    (triangleHeight * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 3);
  //a = c × sin alpha / sin gamma
  //used to stagger the diagonal lines, before rotating them,to match the rotation
  const bias = (sideC * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

  const lineSideC = (height * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 3);
  const lineLength =
    ((lineSideC * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 6)) * 2;

  //used to perform the cutting action on the different grid types
  const cuttingTool = createPanelFrame({
    width: width + 20000,
    height: height + 20000,
    depth: 200,
    frameWidth: 10000,
    lineWidth: 0,
    spacing: 0,
  });
  cuttingTool.updateMatrix();

  //--------------------Type 1 - Horizontal lines--------------------
  //very simple, just add the lines from top to bottom and cut them to size
  const GroupType1 = new THREE.Group();
  for (
    let y = height / 2 - triangleHeight;
    y >= -height / 2 + config.lineWidth;
    y -= triangleHeight
  ) {
    const lineGeometry = new THREE.BoxGeometry(
      width,
      config.lineWidth,
      config.depth
    );
    const line = new THREE.Mesh(lineGeometry, material);
    line.position.set(0, y, 0);
    line.updateMatrix();
    const line2 = CSG.subtract(line, cuttingTool);
    GroupType1.add(line2);
  }
  //--------------------Type 2 - 120 degrees lines--------------------
  
  const GroupType2 = new THREE.Group();

  cuttingTool.rotation.z = -Math.PI / 6; // Rotate -30 degrees
  cuttingTool.updateMatrix();

  //calculate the starting point to match the top left corner
  let distToEdgeType2 = distanceBetweenParallels(
    0,
    0,
    -width / 2,
    height / 2,
    (Math.PI * 2) / 3
  );
  //check if the center point is beneath the 60deg line drawn from the top left panelPoint => in the negative way
  if (isZnegative(config, new THREE.Vector2(0, 0))) {
    distToEdgeType2 = -distToEdgeType2;
  }

  ///get the start Offset
  const offsetXType2 =
    Math.ceil((diagonal / 2 - distToEdgeType2) / triangleHeight) *
    triangleHeight;
  const startXType2 = distToEdgeType2 + offsetXType2;

  for (let x = -startXType2; x <= diagonal / 2; x += triangleHeight) {
    const lineGeometry = new THREE.BoxGeometry(
      lineLength,
      config.lineWidth,
      config.depth
    );
    const line = new THREE.Mesh(lineGeometry);

    //adding the lines from bottom to top and shift a bit further, so they match the rotation
    line.position.set(x, -bias * (x / triangleHeight), 0);
    line.rotation.z = -Math.PI / 2; // Rotate 90 degrees
    line.updateMatrix();

    const line2 = CSG.subtract(line, cuttingTool);
    line2.material = material;
    GroupType2.add(line2);
  }
  GroupType2.rotation.z = Math.PI / 6; // Rotate 30 degrees

  //--------------------Type 3 - 60 degrees lines--------------------
  const GroupType3 = new THREE.Group();

  cuttingTool.rotation.z = Math.PI / 6; // Rotate 30 degrees
  cuttingTool.updateMatrix();

  //calculate the starting point to match the top left corner
  const distToEdgeType3 = distanceBetweenParallels(
    0,
    0,
    -width / 2,
    height / 2,
    Math.PI / 3
  );
  const offsetXType3 = triangleHeight - (distToEdgeType3 % triangleHeight);
  const startXType3 =
    Math.ceil(distToEdgeType3 / triangleHeight) * triangleHeight - offsetXType3;

  for (let x = -startXType3; x <= diagonal / 2; x += triangleHeight) {
    const lineGeometry = new THREE.BoxGeometry(
      lineLength,
      config.lineWidth,
      config.depth
    );
    const line = new THREE.Mesh(lineGeometry);

    //adding the lines from bottom to top and shift a bit further, so they match the rotation
    line.position.set(x, bias * (x / triangleHeight), 0);
    line.rotation.z = -Math.PI / 2;
    line.updateMatrix();

    const line2 = CSG.subtract(line, cuttingTool);
    line2.material = material;
    GroupType3.add(line2);
  }
  GroupType3.rotation.z = -Math.PI / 6; // Rotate -30 degrees

  //for anti-aliasing
  GroupType2.position.z = -0.01;
  GroupType3.position.z = -0.02;

  GroupType2.updateMatrix();
  GroupType3.updateMatrix();

  return new THREE.Group().add(GroupType1, GroupType2, GroupType3);
}
