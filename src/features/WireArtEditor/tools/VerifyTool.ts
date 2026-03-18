import type { LineData } from '../models/Line';
import type { PointData } from '../models/Point';
import type { Tool, ToolContext } from './Tool';
import * as THREE from 'three';

/**
 * Checks the Graph for correctness and highlights every invalid part
 */
export class VerifyTool implements Tool {
  private context: ToolContext;
  private adjList: Map<string, Set<string>>;
  private pointMap: Map<string, PointData>;
  private points: PointData[];
  private lines: LineData[];
  private previewMeshes: THREE.Mesh[] = [];

  constructor(context: ToolContext) {
    this.context = context;
    this.adjList = new Map();
    this.pointMap = new Map();
    this.points = [...this.context.model.points.values()];
    this.lines = [...this.context.model.lines.values()];
  }

  onClick() {
    this.points = [...this.context.model.points.values()];
    this.lines = [...this.context.model.lines.values()];
    this.clearPreview();
    this.buildAdjList();
    this.findHotSingles();
    this.findLineIntersections();
    this.findFaces();
  }

  buildAdjList() {
    this.adjList.clear();
    this.pointMap.clear();

    for (const p of this.points) {
      this.adjList.set(p.id, new Set());
      this.pointMap.set(p.id, p);
    }

    // Initialize adjacency list with all points
    for (const p of this.points) {
      this.adjList.set(p.id, new Set());
    }

    // Fill adjacency list from lines
    for (const line of this.lines) {
      const start = line.startPointId;
      const end = line.endPointId;

      if (this.adjList.has(start)) {
        this.adjList.get(start)!.add(end);
      }

      if (this.adjList.has(end)) {
        this.adjList.get(end)!.add(start);
      }
    }
  }

  findHotSingles() {
    const invalidIds: string[] = [];
    for (const [id, neighbors] of this.adjList) {
      if (neighbors.size < 2) {
        invalidIds.push(id);
      }
    }

    console.log(invalidIds);
    this.context.pointRenderer.setInvalid(invalidIds);
  }

  findLineIntersections() {
    const invalidLines = new Set<string>();

    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const l1 = this.lines[i];
        const l2 = this.lines[j];

        // skip if they share endpoints
        if (
          l1.startPointId === l2.startPointId ||
          l1.startPointId === l2.endPointId ||
          l1.endPointId === l2.startPointId ||
          l1.endPointId === l2.endPointId
        ) {
          continue;
        }

        const p1 = this.pointMap.get(l1.startPointId)!;
        const p2 = this.pointMap.get(l1.endPointId)!;
        const p3 = this.pointMap.get(l2.startPointId)!;
        const p4 = this.pointMap.get(l2.endPointId)!;

        if (this.segmentsIntersect(p1, p2, p3, p4)) {
          invalidLines.add(l1.id);
          invalidLines.add(l2.id);
        }
      }
    }

    console.log(invalidLines);
    if (invalidLines.size > 0) {
      this.context.lineRenderer.setInvalid([...invalidLines]);
    }
  }

  segmentsIntersect(a: PointData, b: PointData, c: PointData, d: PointData) {
    const orient = (p: PointData, q: PointData, r: PointData) =>
      (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

    const o1 = orient(a, b, c);
    const o2 = orient(a, b, d);
    const o3 = orient(c, d, a);
    const o4 = orient(c, d, b);

    return o1 * o2 < 0 && o3 * o4 < 0;
  }

  findFaces() {
    const visited = new Set<string>();
    const faces: string[][] = [];

    const getAngle = (a: PointData, b: PointData) => Math.atan2(b.y - a.y, b.x - a.x);

    const sortedNeighbors = new Map<string, string[]>();

    for (const [id, neighbors] of this.adjList) {
      const p = this.pointMap.get(id)!;

      const sorted = [...neighbors].sort((n1, n2) => {
        const a = getAngle(p, this.pointMap.get(n1)!);
        const b = getAngle(p, this.pointMap.get(n2)!);
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

    for (const line of this.lines) {
      const start = line.startPointId;
      const end = line.endPointId;

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

        if (face.length >= 3) faces.push(face);
      }
    }

    faces.sort((a, b) => this.polygonArea(b) - this.polygonArea(a));
    faces.shift(); // remove outer face

    this.previewOffsetPolygons(faces, 0.1);
  }

  offsetPolygon(face: string[], offset: number) {
    const pts = face.map((id) => {
      const p = this.pointMap.get(id)!;
      return new THREE.Vector2(p.x, p.y);
    });

    const n = pts.length;

    const edges: { a: THREE.Vector2; b: THREE.Vector2 }[] = [];

    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];

      const dir = new THREE.Vector2().subVectors(b, a).normalize();
      const normal = new THREE.Vector2(-dir.y, dir.x);

      const oa = a.clone().addScaledVector(normal, offset);
      const ob = b.clone().addScaledVector(normal, offset);

      edges.push({ a: oa, b: ob });
    }

    const result: THREE.Vector2[] = [];

    for (let i = 0; i < n; i++) {
      const e1 = edges[(i - 1 + n) % n];
      const e2 = edges[i];

      const p = this.lineIntersection(e1.a, e1.b, e2.a, e2.b);

      if (p) result.push(p);
    }

    return result;
  }

  previewOffsetPolygons(faces: string[][], offset: number) {
    const scene = this.context.sceneManager.scene;

    for (const face of faces) {
      const offsetPoly = this.offsetPolygon(face, offset);
      if (offsetPoly.length < 3) continue;

      const vertices: number[] = [];

      for (const v of offsetPoly) {
        vertices.push(v.x, v.y, 0);
      }

      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const indices: number[] = [];
      for (let i = 1; i < offsetPoly.length - 1; i++) {
        indices.push(0, i, i + 1);
      }

      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.previewMeshes.push(mesh);
      scene.add(mesh);
    }
  }

  lineIntersection(a1: THREE.Vector2, a2: THREE.Vector2, b1: THREE.Vector2, b2: THREE.Vector2) {
    const da = a2.clone().sub(a1);
    const db = b2.clone().sub(b1);
    const dp = a1.clone().sub(b1);

    const dap = new THREE.Vector2(-da.y, da.x);

    const denom = dap.dot(db);
    if (Math.abs(denom) < 1e-6) return null;

    const num = dap.dot(dp);

    return b1.clone().addScaledVector(db, num / denom);
  }

  previewPolygons(faces: string[][]) {
    const scene = this.context.sceneManager.scene;

    for (const face of faces) {
      const vertices: number[] = [];

      for (const id of face) {
        const p = this.pointMap.get(id)!;
        vertices.push(p.x, p.y, p.z ?? 0);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      geometry.setIndex(
        Array.from({ length: face.length - 2 }, (_, i) => [0, i + 1, i + 2]).flat(),
      );

      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.previewMeshes.push(mesh);
      scene.add(mesh);
    }
  }

  clearPreview() {
    const scene = this.context.sceneManager.scene;

    for (const mesh of this.previewMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }

    this.previewMeshes = [];
  }

  polygonArea(face: string[]) {
    let area = 0;

    for (let i = 0; i < face.length; i++) {
      const p1 = this.pointMap.get(face[i])!;
      const p2 = this.pointMap.get(face[(i + 1) % face.length])!;

      area += p1.x * p2.y - p2.x * p1.y;
    }

    return Math.abs(area);
  }

  dispose(): void {
    this.clearPreview();
  }
}
