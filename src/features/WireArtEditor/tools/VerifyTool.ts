import type { LineData } from '../models/Line';
import type { PointData } from '../models/Point';
import {
  buildAdjList,
  findIsolatedPoints,
  findLineIntersections,
  findPoygons,
  insetPolygons,
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

  wasGridVisible = true;
  wasImageVisible = true;

  constructor(context: ToolContext) {
    this.context = context;
    this.adjList = new Map();
    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
  }

  onClick() {
    this.clearPreview();
    this.wasGridVisible = this.context.gridRenderer.getVisible();
    this.wasImageVisible = this.context.imageRenderer.getVisible();
    this.context.gridRenderer.setVisible(false);
    this.context.imageRenderer.setVisible(false);

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

    let inset = insetPolygons(polygons, this.points, 0.1);
    this.previewPolygons(inset);
    this.previewPolygons(insetPolygons(polygons, this.points, 0), 0.3);
    //this.findFaces();
    this.context.sceneManager.setCameraMode('3D');
  }

  previewPolygons(faces: THREE.Vector2[][], height = 1.8) {
    const scene = this.context.sceneManager.scene;

    for (const face of faces) {
      if (face.length < 3) continue;

      // Create shape from polygon
      const shape = new THREE.Shape();
      shape.moveTo(face[0].x, face[0].y);

      for (let i = 1; i < face.length; i++) {
        shape.lineTo(face[i].x, face[i].y);
      }

      shape.closePath();

      // Extrude settings
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false, // keep it clean for now
      });

      const material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
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
    this.context.sceneManager.setCameraMode('2D');
    this.context.gridRenderer.setVisible(this.wasGridVisible);
    this.context.imageRenderer.setVisible(this.wasImageVisible);
  }
}
