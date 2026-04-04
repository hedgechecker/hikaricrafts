import * as THREE from "three";
import { Vector2 } from "three";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";

export type Vertex = {
  id: string;
  position: Vector2;
};

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
    if (neighbors.size == 0) {
      invalidIds.push(id);
    }
  }
  return invalidIds;
}

export function findSingleConnectionPoints(adjList: Map<string, Set<string>>) {
  const invalidIds: string[] = [];
  for (const [id, neighbors] of adjList) {
    if (neighbors.size == 1) {
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
    point: THREE.Vector3;
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
      if (!p1 || !p2 || !p3 || !p4) {
        console.log(p1, p2, p3, p4);
        continue;
      }

      const result = getSegmentIntersection(
        new Vector2(p1.x, p1.y),
        new Vector2(p2.x, p2.y),
        new Vector2(p3.x, p3.y),
        new Vector2(p4.x, p4.y),
      );

      if (result) {
        result.forEach((point) => {
          intersections.push({
            point,
            line1Id: l1.id,
            line2Id: l2.id,
          });
        });
      }
    }
  }

  return intersections;
}

export function getSegmentIntersection(
  a: Vector2,
  b: Vector2,
  c: Vector2,
  d: Vector2,
): THREE.Vector3[] | null {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);

  //Handle parallel / collinear
  if (Math.abs(denominator) < 1e-6) {
    // check collinearity
    if (isCollinear(a, b, c)) {
      const overlap = getCollinearOverlap(a, b, c, d);
      return overlap.length ? overlap : null;
    }
    return null;
  }

  const t =
    ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;

  const u =
    ((a.x - c.x) * (a.y - b.y) - (a.y - c.y) * (a.x - b.x)) / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [new THREE.Vector3(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y), 0)];
  }

  return null;
}

function getCollinearOverlap(
  a: Vector2,
  b: Vector2,
  c: Vector2,
  d: Vector2,
): THREE.Vector3[] {
  const points = [a, b, c, d];

  // project onto dominant axis
  const useX = Math.abs(a.x - b.x) > Math.abs(a.y - b.y);

  points.sort((p1, p2) => (useX ? p1.x - p2.x : p1.y - p2.y));

  // middle segment is the overlap (if any)
  const pStart = points[1];
  const pEnd = points[2];

  // check if they actually overlap
  const overlaps = useX
    ? Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <=
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x))
    : Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <=
      Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y));

  if (!overlaps) return [];

  return [
    new THREE.Vector3(pStart.x, pStart.y, 0),
    new THREE.Vector3(pEnd.x, pEnd.y, 0),
  ];
}

function isCollinear(a: Vector2, b: Vector2, c: Vector2, eps = 1e-6) {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < eps;
}



export function findPoygons(
  points: Map<string, PointData>,
  lines: Map<string, LineData>,
) {
  const adjList = buildAdjList(points, lines);
  const visited = new Set<string>();
  const polygons: Vertex[][] = [];

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

  for (const [a, neighbors] of adjList) {
    for (const b of neighbors) {
      const edgeKey = `${a}->${b}`;
      if (visited.has(edgeKey)) continue;

      const face: Vertex[] = [];

      let currA = a;
      let currB = b;

      while (true) {
        visited.add(`${currA}->${currB}`);

        const p = points.get(currA)!;

        face.push({
          id: currA,
          position: new Vector2(p.x, p.y),
        });

        const [na, nb] = nextEdge(currA, currB);

        currA = na;
        currB = nb;

        if (currA === a && currB === b) break;
      }

      if (face.length >= 3) {
        polygons.push(face);
      }
    }
  }
  polygons.sort(
    (a, b) => polygonArea(b) - polygonArea(a),
  );

 const components = findComponents(adjList);

 const result: Vertex[][] = [];

 for (const comp of components) {
   const compSet = new Set(comp);

   const compPolys = polygons.filter((p) =>
     polygonBelongsToComponent(p, compSet),
   );

   if (compPolys.length === 0) continue;

   // sort largest → smallest
   compPolys.sort((a, b) => polygonArea(b) - polygonArea(a));

   // 🔥 remove THIS component's outer face
   compPolys.shift();

   result.push(...compPolys);
 }

 return result;
}

function polygonArea(poly: Vertex[]) {
  let area = 0;

  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;

    const a = poly[i].position;
    const b = poly[j].position;

    area += a.x * b.y - b.x * a.y;
  }

  return Math.abs(area) * 0.5;
}

function findComponents(adjList: Map<string, Set<string>>) {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const start of adjList.keys()) {
    if (visited.has(start)) continue;

    const stack = [start];
    const comp: string[] = [];

    while (stack.length) {
      const node = stack.pop()!;
      if (visited.has(node)) continue;

      visited.add(node);
      comp.push(node);

      for (const n of adjList.get(node) || []) {
        if (!visited.has(n)) stack.push(n);
      }
    }

    components.push(comp);
  }

  return components;
}

function polygonBelongsToComponent(poly: Vertex[], comp: Set<string>) {
  return comp.has(poly[0].id);
}

function lineIntersection(
  p: Vector2,
  r: Vector2,
  q: Vector2,
  s: Vector2,
): Vector2 | null {
  const cross = (a: Vector2, b: Vector2) => a.x * b.y - a.y * b.x;

  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-8) return null; // parallel

  const qp = q.clone().sub(p);
  const t = cross(qp, s) / rxs;

  return p.clone().add(r.clone().multiplyScalar(t));
}

export function insetPolygon(polygon: Vertex[], inset: number): Vertex[] {
  const result: Vertex[] = [];
  const n = polygon.length;

  const clockwise = isClockwise(polygon);
  const sign = clockwise ? -1 : 1;

  for (let i = 0; i < n; i++) {
    const v0 = polygon[(i - 1 + n) % n];
    const v1 = polygon[i];
    const v2 = polygon[(i + 1) % n];

    const p0 = v0.position;
    const p1 = v1.position;
    const p2 = v2.position;

    // edge directions
    const d1 = p1.clone().sub(p0).normalize();
    const d2 = p2.clone().sub(p1).normalize();

    // normals (correct orientation)
    const n1 = new Vector2(-d1.y * sign, d1.x * sign);
    const n2 = new Vector2(-d2.y * sign, d2.x * sign);

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

    if (intersect) {
      result.push({
        id: v1.id, // 🔥 preserve original vertex ID
        position: intersect, // new inset position
      });
    }
  }

  return result;
}

export function insetPolygons(polygons: Vertex[][], inset: number) {
  return polygons.map((poly) => insetPolygon(poly, inset));
}

function isClockwise(polygon: Vertex[]) {
  let sum = 0;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i].position;
    const b = polygon[(i + 1) % polygon.length].position;
    sum += (b.x - a.x) * (b.y + a.y);
  }

  return sum > 0;
}

export function isConcave(polygon: Vector2[], epsilon = 1e-4): boolean {
  const n = polygon.length;
  if (n < 4) return false;

  let sign = 0;

  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const c = polygon[(i + 2) % n];

    const ab = b.clone().sub(a);
    const bc = c.clone().sub(b);

    const cross = ab.x * bc.y - ab.y * bc.x;

    if (Math.abs(cross) < epsilon) continue;

    const currentSign = Math.sign(cross);

    if (sign === 0) {
      sign = currentSign;
    } else if (currentSign !== sign) {
      return true; // concave
    }
  }

  return false; // convex
}

const crossProduct = (a: any, b: any, c: any) => {
  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);
  return ab.x * ac.y - ab.y * ac.x;
};

export function findConcaveVertices(
  polygon: Vertex[],
  epsilon = 1e-8,
): string[] {
  const n = polygon.length;
  const concaveIds: string[] = [];

  const winding = getPolygonWinding(polygon);

  for (let i = 0; i < n; i++) {
    const a = polygon[i].position;
    const b = polygon[(i + 1) % n].position;
    const c = polygon[(i + 2) % n].position;

    const cross = crossProduct(a, b, c);

    if (Math.abs(cross) < epsilon) continue;

    const turn = Math.sign(cross);

    // concave if turn is opposite to polygon winding
    if (turn !== winding) {
      concaveIds.push(polygon[(i + 1) % n].id);
    }
  }

  return concaveIds;
}

function getPolygonWinding(polygon: Vertex[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i].position;
    const p2 = polygon[(i + 1) % polygon.length].position;
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.sign(area); // +1 CCW, -1 CW
}
