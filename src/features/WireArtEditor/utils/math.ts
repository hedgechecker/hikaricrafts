import * as THREE from 'three';

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
