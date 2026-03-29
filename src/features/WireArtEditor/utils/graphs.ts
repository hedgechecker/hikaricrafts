import * as THREE from "three";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";

export function buildAdjList(
  points: Map<string, PointData>,
  lines: Map<string, LineData>,
) {
  let adjList: Map<string, Set<string>> = new Map();

  // Initialize adjacency list with all points
  points.forEach((_point, id) => {
    adjList.set(id, new Set());
  });

  // Fill adjacency list from lines
  lines.forEach((line) => {
    const start = line.startPointId;
    const end = line.endPointId;

    if (adjList.has(start)) {
      adjList.get(start)!.add(end);
    }

    if (adjList.has(end)) {
      adjList.get(end)!.add(start);
    }
  });
  return adjList;
}

export function findIsolatedPoints(adjList: Map<string, Set<string>>) {
  const invalidIds: string[] = [];
  for (const [id, neighbors] of adjList) {
    if (neighbors.size < 2) {
      invalidIds.push(id);
    }
  }
  return invalidIds;
}

export function findLineIntersections(
  points: Map<string, PointData>,
  lines: Map<string, LineData>,
) {
  const intersections: {
    point: THREE.Vector2;
    line1Id: string;
    line2Id: string;
  }[] = [];

  const lineArray = Array.from(lines.values());

  for (let i = 0; i < lineArray.length; i++) {
    for (let j = i + 1; j < lineArray.length; j++) {
      const l1 = lineArray[i];
      const l2 = lineArray[j];

      if (
        l1.startPointId === l2.startPointId ||
        l1.startPointId === l2.endPointId ||
        l1.endPointId === l2.startPointId ||
        l1.endPointId === l2.endPointId
      ) {
        continue;
      }

      const p1 = points.get(l1.startPointId)!;
      const p2 = points.get(l1.endPointId)!;
      const p3 = points.get(l2.startPointId)!;
      const p4 = points.get(l2.endPointId)!;

      const intersection = getSegmentIntersection(
        new THREE.Vector2(p1.x, p1.y),
        new THREE.Vector2(p2.x, p2.y),
        new THREE.Vector2(p3.x, p3.y),
        new THREE.Vector2(p4.x, p4.y),
      );

      if (intersection) {
        intersections.push({
          point: intersection,
          line1Id: l1.id,
          line2Id: l2.id,
        });
      }
    }
  }

  return intersections;
}

export function getSegmentIntersection(
  a: THREE.Vector2,
  b: THREE.Vector2,
  c: THREE.Vector2,
  d: THREE.Vector2,
): THREE.Vector2 | null {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);

  if (denominator === 0) return null;

  const t =
    ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;

  const u =
    ((a.x - c.x) * (a.y - b.y) - (a.y - c.y) * (a.x - b.x)) / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return new THREE.Vector2(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y));
  }

  return null;
}

export function findPoygons(
  points: Map<string, PointData>,
  lines: Map<string, LineData>,
  adjList: Map<string, Set<string>>,
) {
  const visited = new Set<string>();
  const polygons: string[][] = [];

  const getAngle = (a: PointData, b: PointData) =>
    Math.atan2(b.y - a.y, b.x - a.x);

  const sortedNeighbors = new Map<string, string[]>();

  for (const [id, neighbors] of adjList) {
    const p = points.get(id)!;

    const sorted = [...neighbors].sort((n1, n2) => {
      const a = getAngle(p, points.get(n1)!);
      const b = getAngle(p, points.get(n2)!);
      return a - b;
    });

    sortedNeighbors.set(id, sorted);
  }

  const nextEdge = (a: string, b: string) => {
    const neighbors = sortedNeighbors.get(b)!;
    const idx = neighbors.indexOf(a);
    const next = neighbors[(idx - 1 + neighbors.length) % neighbors.length];
    return [b, next];
  };

  for (const line of lines) {
    const start = line[1].startPointId;
    const end = line[1].endPointId;

    for (const [a, b] of [
      [start, end],
      [end, start],
    ]) {
      const edgeKey = `${a}->${b}`;
      if (visited.has(edgeKey)) continue;

      const face: string[] = [];

      let currA = a;
      let currB = b;

      while (true) {
        visited.add(`${currA}->${currB}`);
        face.push(currA);

        const [na, nb] = nextEdge(currA, currB);

        currA = na;
        currB = nb;

        if (currA === a && currB === b) break;
      }

      if (face.length >= 3) polygons.push(face);
    }
  }

  polygons.sort((a, b) => polygonArea(points, b) - polygonArea(points, a));
  polygons.shift(); // remove outer face

  //this.previewOffsetPolygons(faces, 0.1);
  return polygons;
}

export function polygonArea(points: Map<string, PointData>, polygon: string[]) {
  let area = 0;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = points.get(polygon[i])!;
    const p2 = points.get(polygon[(i + 1) % polygon.length])!;

    area += p1.x * p2.y - p2.x * p1.y;
  }

  return Math.abs(area);
}

function lineIntersection(
  p: THREE.Vector2,
  r: THREE.Vector2,
  q: THREE.Vector2,
  s: THREE.Vector2,
): THREE.Vector2 | null {
  const cross = (a: THREE.Vector2, b: THREE.Vector2) => a.x * b.y - a.y * b.x;

  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-8) return null; // parallel

  const qp = q.clone().sub(p);
  const t = cross(qp, s) / rxs;

  return p.clone().add(r.clone().multiplyScalar(t));
}

export function insetPolygon(
  polygon: string[],
  points: Map<string, PointData>,
  inset: number,
): THREE.Vector2[] {
  const result: THREE.Vector2[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const prev = points.get(polygon[(i - 1 + n) % n])!;
    const curr = points.get(polygon[i])!;
    const next = points.get(polygon[(i + 1) % n])!;

    const p0 = new THREE.Vector2(prev.x, prev.y);
    const p1 = new THREE.Vector2(curr.x, curr.y);
    const p2 = new THREE.Vector2(next.x, next.y);

    // edge directions
    const d1 = p1.clone().sub(p0).normalize();
    const d2 = p2.clone().sub(p1).normalize();

    // perpendicular (left normal)
    const n1 = new THREE.Vector2(-d1.y, d1.x);
    const n2 = new THREE.Vector2(-d2.y, d2.x);

    // offset lines
    const offsetP1 = p1.clone().add(n1.multiplyScalar(inset));
    const offsetDir1 = d1.clone();

    const offsetP2 = p1.clone().add(n2.multiplyScalar(inset));
    const offsetDir2 = d2.clone();

    const intersect = lineIntersection(
      offsetP1,
      offsetDir1,
      offsetP2,
      offsetDir2,
    );

    if (intersect) result.push(intersect);
  }

  return result;
}

export function insetPolygons(
  polygons: string[][],
  points: Map<string, PointData>,
  inset: number,
) {
  return polygons.map((poly) => insetPolygon(poly, points, inset));
}
