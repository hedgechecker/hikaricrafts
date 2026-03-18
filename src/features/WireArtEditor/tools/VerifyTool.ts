import type { LineData } from '../models/Line';
import type { PointData } from '../models/Point';
import {
  buildAdjList,
  findIsolatedPoints,
  findLineIntersections,
  findPoygons,
} from '../utils/graphs';
import type { Tool, ToolContext } from './Tool';
import * as THREE from 'three';

/**
 * Checks the Graph for correctness and highlights every invalid part
 */
export class VerifyTool implements Tool {
  private context: ToolContext;

  private adjList: Map<string, Set<string>>;
  private points: Map<string, PointData>;
  private lines: Map<string, LineData>;
  private previewMeshes: THREE.Mesh[] = [];

  constructor(context: ToolContext) {
    this.context = context;
    this.adjList = new Map();
    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
  }

  onClick() {
    this.clearPreview();

    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
    this.adjList = buildAdjList(this.points, this.lines);

    let single = findIsolatedPoints(this.adjList);
    this.context.pointRenderer.setInvalid(single);
    console.log(single);

    let intersects = findLineIntersections(this.points, this.lines);
    this.context.lineRenderer.setInvalid(intersects);
    console.log(intersects);

    let polygons = findPoygons(this.points, this.lines, this.adjList);
    this.previewPolygons(polygons);
    //this.findFaces();
    this.context.sceneManager.setCameraMode('3D');
   
  }

  offsetPolygon(face: string[], offset: number) {
    const pts = face.map((id) => {
      const p = this.points.get(id)!;
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
        const p = this.points.get(id)!;
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

  dispose(): void {
    this.clearPreview();
  }
}
