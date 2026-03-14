import * as THREE from 'three';

/**
 * Projects a Point onto a given Segment
 * @param p Point to be Projected
 * @param a StartPoint of Segment
 * @param b EndPoint of Segment
 * @returns the Projected Point
 */
export function projectPointToSegment(
  p: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
): THREE.Vector3 {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ap = new THREE.Vector3().subVectors(p, a);

  const abLenSq = ab.lengthSq();
  if (abLenSq === 0) return a.clone();

  let t = ap.dot(ab) / abLenSq;
  t = Math.max(0, Math.min(1, t)); // clamp to segment

  return new THREE.Vector3().copy(a).add(ab.multiplyScalar(t));
}


/**
 * Calculates a best snapping angle out of:
 * -global snapping(45° increments)
 * -relative snapping (colinear or 90°) to existing lines given by the connected Points
 * @param start the Origin of the Angle
 * @param target the Point to find a closest match to
 * @param connectedPoints all Points connected to the start position
 * @returns the best snapping candidate
 */
export function snapAngle(
  start: THREE.Vector3,
  target: THREE.Vector3,
  connectedPoints: THREE.Vector3[],
): THREE.Vector3 {
  const dir = target.clone().sub(start);
  const distance = dir.length();

  let baseAngle = Math.atan2(dir.y, dir.x);

  const candidateAngles: number[] = [];

  // 1. Global snapping (45°)
  const increment = Math.PI / 4;
  candidateAngles.push(Math.round(baseAngle / increment) * increment);

  // 2. Relative snapping
  if (connectedPoints.length > 0) {
    for (const point of connectedPoints) {
      const lineDir = point.clone().sub(start);
      const lineAngle = Math.atan2(lineDir.y, lineDir.x);

      candidateAngles.push(lineAngle);
      candidateAngles.push(lineAngle + Math.PI);

      candidateAngles.push(lineAngle + Math.PI / 2);
      candidateAngles.push(lineAngle - Math.PI / 2);
    }
  }

  // 3. Pick closest angle
  let bestAngle = candidateAngles[0];
  let smallestDiff = Infinity;

  for (const candidate of candidateAngles) {
    const diff = Math.abs(
      THREE.MathUtils.euclideanModulo(baseAngle - candidate + Math.PI, Math.PI * 2) - Math.PI,
    );

    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestAngle = candidate;
    }
  }

  // 4. Apply snap
  return start
    .clone()
    .add(new THREE.Vector3(Math.cos(bestAngle) * distance, Math.sin(bestAngle) * distance, 0));
}

/**
 * Parses a String into a Math expression and evaluates it
 * @param value The Value that could be a Math expression
 * @returns null if the value is not a valid expression,
 * else the value of the calculated Expression
 */
export function parseMathInput(value: string): number | null {
  if (!value) return null;

  let normalized = value.replace(/,/g, '.').trim();
  normalized = normalized.replaceAll('m', '');
  normalized = normalized.replace('°', '');
  console.log(normalized)
  
  // allow only numbers and math operators
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${normalized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}
