import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import type { gridPosition, PanelConfig } from "./InterfaceUtils";


/**
 * Returns the intersection point of two infinite lines, each defined by a point and an angle.
 * If the lines are parallel (no intersection), returns `null`.
 * @param x1 X-coordinate of a point on the first line
 * @param y1 Y-coordinate of a point on the first line
 * @param angle1 Angle (in radians) of the first line
 * @param x2 X-coordinate of a point on the second line
 * @param y2 Y-coordinate of a point on the second line
 * @param angle2 Angle (in radians) of the second line
 * @returns The intersection point `{ x, y }` or `null` if the lines are parallel
 */
export function intersectionOfLinesFromAngles(
  x1: number,
  y1: number,
  angle1: number,
  x2: number,
  y2: number,
  angle2: number
): { x: number; y: number } | null {
  // Direction vectors
  const dx1 = Math.cos(angle1);
  const dy1 = Math.sin(angle1);
  const dx2 = Math.cos(angle2);
  const dy2 = Math.sin(angle2);

  // Solve linear system:
  // (x1, y1) + t1 * (dx1, dy1) = (x2, y2) + t2 * (dx2, dy2)
  // => t1 * dx1 - t2 * dx2 = x2 - x1
  //    t1 * dy1 - t2 * dy2 = y2 - y1

  const denom = dx1 * dy2 - dy1 * dx2;

  // If denom ≈ 0 → lines are parallel or coincident
  if (Math.abs(denom) < 1e-10) return null;

  const t1 = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / denom;

  // Intersection point on line 1
  const x = x1 + t1 * dx1;
  const y = y1 + t1 * dy1;

  return { x, y };
}

// Convert a group into a single mesh
export function mergeGroup(group: THREE.Group) {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      let geom = obj.geometry.clone();
      obj.updateWorldMatrix(true, false);
      if (!geom.index) {
        geom = BufferGeometryUtils.mergeVertices(geom);
      }
      geom.applyMatrix4(obj.matrixWorld); // bake transforms
      geometries.push(geom);
      materials.push(obj.material);
    }
  });

  const merged = BufferGeometryUtils.mergeGeometries(geometries, true);
  return new THREE.Mesh(merged, materials);
}


export function getGridXYZ(x: number, y: number, config: PanelConfig) {
  const triangleHeight = Math.sqrt(
    config.spacing * config.spacing -
      ((config.spacing / 2) * config.spacing) / 2
  );
  //the relative Coordinates in Amount of triangles from The Top Left Corner
  const relativeX = Math.floor(
    distanceBetweenParallels(
      -config.width / 2 + config.frameWidth,
      config.height / 2 - config.frameWidth,
      x,
      y,
      0
    ) / triangleHeight
  );

  const relativeY = Math.floor(
    distanceBetweenParallels(
      -config.width / 2 + config.frameWidth,
      config.height / 2 - config.frameWidth,
      x,
      y,
      Math.PI / 3
    ) / triangleHeight
  );

  let relativeZ = Math.floor(
    distanceBetweenParallels(
      -config.width / 2 + config.frameWidth,
      config.height / 2 - config.frameWidth,
      x,
      y,
      Math.PI * (2 / 3)
    ) / triangleHeight
  );

  //Check if the 120 deg line goes into negative way
  if (isZnegative(config, new THREE.Vector2(x, y))) {
    relativeZ = -relativeZ - 1;
  }

  return { x: relativeX, y: relativeY, z: relativeZ };
}

export function getSceneXY(pos: gridPosition, config: PanelConfig) {
  let snappedPoint = new THREE.Vector3(0, 0, -config.depth / 2 + 0.25);
  const triangleHeight = Math.sqrt(
    config.spacing * config.spacing -
      ((config.spacing / 2) * config.spacing) / 2
  );
  var scenePos = {
    pos: {x:0,y:0,z:0},
    rotation: 0,
  };
  snappedPoint.x =
    -config.width / 2 +
    config.frameWidth +
    (pos.y + pos.z + 1) * (config.spacing / 2);
  if (
    (pos.x % 2 == 0 && (pos.y + pos.z) % 2 == 0) ||
    (pos.x % 2 != 0 && (pos.y + pos.z) % 2 != 0)
  ) {
    snappedPoint.y =
      config.height / 2 -
      config.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (1 / 3);
    scenePos.rotation = 1;
  } else {
    snappedPoint.y = snappedPoint.y =
      config.height / 2 -
      config.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (2 / 3);
    scenePos.rotation = 0;
  }
  scenePos.pos = { x: snappedPoint.x, y: snappedPoint.y, z: snappedPoint.z };
  return scenePos;
}

export function parseXYZ(str: string) {
    const match = str.match(/X(-?\d+)Y(-?\d+)Z(-?\d+)/);
    if (!match) return null;
    const [, x, y, z] = match.map(Number);
    return { x: x, y: y, z: z };
  }