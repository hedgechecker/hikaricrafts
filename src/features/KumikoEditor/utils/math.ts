import * as THREE from "three";
import type { Settings } from "../models/Settings";
import type { PatternPos } from "../models/Pattern";

/**
 * Parses a String into a Math expression and evaluates it
 * @param value The Value that could be a Math expression
 * @returns null if the value is not a valid expression,
 * else the value of the calculated Expression
 */
export function parseMathInput(value: string): number | null {
  if (!value) return null;

  let normalized = value.replace(/,/g, ".").trim();
  normalized = normalized.replaceAll("m", "");
  normalized = normalized.replace("°", "");

  // allow only numbers and math operators
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${normalized})`)();

    if (typeof result !== "number" || !isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * returns the distance between two parallels, that go through the points 1 and 2
 * @param x1 First Point
 * @param y1 First Point
 * @param x2 Second Point
 * @param y2 Second Point
 * @param angle angle in radians, in wich the lines go through the points
 * @returns distance between two parallels
 */
export function distanceBetweenParallels(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number,
) {
  // Direction vector of the line (angle in radians)
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  // Normal vector
  const nx = -dy;
  const ny = dx;

  // Vector between points
  const vx = x2 - x1;
  const vy = y2 - y1;

  // Projection of v onto n (absolute value)
  return Math.abs(vx * nx + vy * ny);
}

/**
 * Checks if the Point goes into the negative direction (120deg grid direction)
 * @param settings the Panel Dimensions
 * @param point the point to get checked
 * @returns boolean
 */
export function isZnegative(settings: Settings, point: THREE.Vector2) {
  //Check if the 120 deg line goes into negative way
  const a = new THREE.Vector3(
    -settings.width / 2 + settings.frameWidth,
    settings.height / 2 - settings.frameWidth,
    0,
  );
  const b = new THREE.Vector3(
    -settings.width / 2 +
      settings.frameWidth +
      ((settings.height - 2 * settings.frameWidth) * Math.sin(Math.PI / 6)) /
        Math.sin(Math.PI / 3),
    -settings.height / 2 + settings.frameWidth,
    0,
  );
  return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) < 0;
}

export function getGridXYZ(x: number, y: number, settings: Settings): PatternPos {
  const triangleHeight = Math.sqrt(
    settings.spacing * settings.spacing -
      ((settings.spacing / 2) * settings.spacing) / 2,
  );
  //the relative Coordinates in Amount of triangles from The Top Left Corner
  const relativeX = Math.floor(
    distanceBetweenParallels(
      -settings.width / 2 + settings.frameWidth,
      settings.height / 2 - settings.frameWidth,
      x,
      y,
      0,
    ) / triangleHeight,
  );

  const relativeY = Math.floor(
    distanceBetweenParallels(
      -settings.width / 2 + settings.frameWidth,
      settings.height / 2 - settings.frameWidth,
      x,
      y,
      Math.PI / 3,
    ) / triangleHeight,
  );

  let relativeZ = Math.floor(
    distanceBetweenParallels(
      -settings.width / 2 + settings.frameWidth,
      settings.height / 2 - settings.frameWidth,
      x,
      y,
      Math.PI * (2 / 3),
    ) / triangleHeight,
  );

  //Check if the 120 deg line goes into negative way
  if (isZnegative(settings, new THREE.Vector2(x, y))) {
    relativeZ = -relativeZ - 1;
  }

  const pos: PatternPos = { x: relativeX, y: relativeY, z: relativeZ, rotation:0 };
  pos.rotation = getSceneXY(pos, settings).rotation as 0 | 1 | 2;
  return pos;
}

export function getScenePos(pos: PatternPos, settings: Settings): PatternPos {
  let snappedPoint = new THREE.Vector3(0, 0, -settings.depth / 2 + 0.25);
  const triangleHeight = Math.sqrt(
    settings.spacing * settings.spacing -
      ((settings.spacing / 2) * settings.spacing) / 2,
  );
  var scenePos: PatternPos = { x: 0, y: 0, z: 0, rotation: 0 };
  snappedPoint.x =
    -settings.width / 2 +
    settings.frameWidth +
    (pos.y + pos.z + 1) * (settings.spacing / 2);
  if (
    (pos.x % 2 == 0 && (pos.y + pos.z) % 2 == 0) ||
    (pos.x % 2 != 0 && (pos.y + pos.z) % 2 != 0)
  ) {
    snappedPoint.y =
      settings.height / 2 -
      settings.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (1 / 3);
    scenePos.rotation = 1;
  } else {
    snappedPoint.y = snappedPoint.y =
      settings.height / 2 -
      settings.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (2 / 3);
    scenePos.rotation = 0;
  }
  scenePos.x = snappedPoint.x;
  scenePos.y = snappedPoint.y;
  scenePos.z = snappedPoint.z;
  return scenePos;
}

export function getSceneXY(pos: PatternPos, settings: Settings) {
  let snappedPoint = new THREE.Vector3(0, 0, -settings.depth / 2 + 0.25);
  const triangleHeight = Math.sqrt(
    settings.spacing * settings.spacing -
      ((settings.spacing / 2) * settings.spacing) / 2,
  );
  var scenePos = {
    pos: { x: 0, y: 0, z: 0 },
    rotation: 0,
  };
  snappedPoint.x =
    -settings.width / 2 +
    settings.frameWidth +
    (pos.y + pos.z + 1) * (settings.spacing / 2);
  if (
    (pos.x % 2 == 0 && (pos.y + pos.z) % 2 == 0) ||
    (pos.x % 2 != 0 && (pos.y + pos.z) % 2 != 0)
  ) {
    snappedPoint.y =
      settings.height / 2 -
      settings.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (1 / 3);
    scenePos.rotation = 1;
  } else {
    snappedPoint.y = snappedPoint.y =
      settings.height / 2 -
      settings.frameWidth -
      pos.x * triangleHeight -
      triangleHeight * (2 / 3);
    scenePos.rotation = 0;
  }
  scenePos.pos = { x: snappedPoint.x, y: snappedPoint.y, z: snappedPoint.z };
  return scenePos;
}
