import { showDialog } from "../../global/dialogController";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";
import {
  buildAdjList,
  findIsolatedPoints,
  findLineIntersections,
  findPoygons,
  insetPolygons,
} from "../utils/graphs";
import type { Tool, ToolContext } from "./Tool";
import * as THREE from "three";

/**
 * Checks the Graph for correctness and highlights every invalid part
 */
export class VerifyTool implements Tool {
  private context: ToolContext;

  private adjList: Map<string, Set<string>>;
  private points: Map<string, PointData>;
  private lines: Map<string, LineData>;
  private previewMeshes: THREE.Mesh[] = [];

  wasPointsVisible = true;
  wasLinesVisible = true;
  wasGridVisible = true;
  wasImageVisible = true;

  constructor(context: ToolContext) {
    this.context = context;
    this.adjList = new Map();
    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
  }

  async onClick() {
    this.clearPreview();

    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
    this.adjList = buildAdjList(this.points, this.lines);

    let single = findIsolatedPoints(this.adjList);
    if (single.length > 0) {
      const result = await showDialog({
        type: "confirm",
        message: "Punkte sollten zwei oder mehr Linien verbinden",
        cancelText: "Abbrechen",
        confirmText: "Punkte automatisch entfernen",
      });
      if (result) {
        //remove points
      } else {
        this.context.pointRenderer.setInvalid(single);
        console.log(single);
        return;
      }
    }

    let intersects = findLineIntersections(this.points, this.lines);
    const uniqueIds = [
      ...new Set(intersects.flatMap((i) => [i.line1Id, i.line2Id])),
    ];

    if (uniqueIds.length > 0) {
      const result = await showDialog({
        type: "confirm",
        message: "Linien dürfen sich nicht schneiden.",
        cancelText: "Abbrechen",
        confirmText: "Linien automatisch aufteilen",
      });
      if (result) {
        //split lines
      } else {
        this.context.lineRenderer.setInvalid(uniqueIds);
        console.log(uniqueIds);
        return;
      }
    }

    let polygons = findPoygons(this.points, this.lines, this.adjList);
    let inset = insetPolygons(polygons, this.points, 0.1);

    const scene = this.context.sceneManager.scene;
    const elems = this.getPolygonMeshes(inset, 1.8);
    const back = this.getPolygonMeshes(
      insetPolygons(polygons, this.points, 0),
      0.3,
      0x000000,
    );
    back.forEach((mesh) => {
      scene.add(mesh);
      this.previewMeshes.push(mesh);
    });
    elems.forEach((mesh) => {
      mesh.position.z += 0.3;
      scene.add(mesh);
      this.previewMeshes.push(mesh);
    });

    this.context.sceneManager.setCameraMode("3D");
    this.wasGridVisible = this.context.gridRenderer.getVisible();
    this.wasImageVisible = this.context.imageRenderer.getVisible();
    this.wasLinesVisible = this.context.lineRenderer.getVisible();
    this.wasPointsVisible = this.context.pointRenderer.getVisible();
    this.context.gridRenderer.setVisible(false);
    this.context.imageRenderer.setVisible(false);
    this.context.pointRenderer.setVisible(false);
    //this.context.lineRenderer.setVisible(false);
  }

  getPolygonMeshes(faces: THREE.Vector2[][], height = 1.8, color?: number) {
    let meshes = [];
    const texture = new THREE.TextureLoader().load("/textures/fichte.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.2, 0.2);

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

      let material;
      if (color != undefined) {
        material = new THREE.MeshBasicMaterial({
          color: color,
        });
      } else {
        material = new THREE.MeshBasicMaterial({
          map: texture,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);

      meshes.push(mesh);
    }
    return meshes;
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
    this.context.sceneManager.setCameraMode("2D");
    this.context.gridRenderer.setVisible(this.wasGridVisible);
    this.context.imageRenderer.setVisible(this.wasImageVisible);
    this.context.pointRenderer.setVisible(this.wasPointsVisible);
    this.context.lineRenderer.setVisible(this.wasLinesVisible);
  }

  async dialog() {
    const result = await showDialog({
      type: "confirm",
      message: "Are you sure?",
    });

    if (result) {
      console.log("User confirmed");
    }
  }
}
