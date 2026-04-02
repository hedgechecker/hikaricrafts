import { showDialog } from "../../global/dialogController";
import { AddLineCommand } from "../commands/AddLineCommand";
import { AddPointCommand } from "../commands/AddPointCommand";
import type { Command } from "../commands/Command";
import { CompositeCommand } from "../commands/CompositeCommand";
import { DeleteLineCommand } from "../commands/DeleteLineCommand";
import { DeletePointCommand } from "../commands/DeletePointCommand";
import type { LineData } from "../models/Line";
import type { PointData } from "../models/Point";
import {
  buildAdjList,
  findConcaveVertices,
  findIsolatedPoints,
  findLineIntersections,
  findPoygons,
  findSingleConnectionPoints,
  insetPolygon,
  insetPolygons,
  isConcave,
  type Vertex,
} from "../utils/graphs";
import { generateId } from "../utils/id";
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

  // Vertex[] → Vector2[]
  toPositions = (poly: Vertex[]) => poly.map((v) => v.position);
  // Vertex[] → string[]
  toIds = (poly: Vertex[]) => poly.map((v) => v.id);

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
    const scene = this.context.sceneManager.scene;
    this.points = this.context.model.points;
    this.lines = this.context.model.lines;
    this.adjList = buildAdjList(this.points, this.lines);

    //1 Check Points
    let noConn = findIsolatedPoints(this.adjList);
    let singleConn = findSingleConnectionPoints(this.adjList);

    if (noConn.length > 0 || singleConn.length > 0) {
      const result = await showDialog({
        type: "confirm",
        message: "Punkte sollten zwei oder mehr Linien verbinden",
        cancelText: "Abbrechen",
        confirmText: "Punkte automatisch entfernen und verbinden",
      });
      if (result) {
        let commands: Command[] = [];
        noConn.forEach((id) => {
          commands.push(new DeletePointCommand(id));
          this.context.pointRenderer.remove(id);
        });

        singleConn.forEach((id) => {
          const pointId = this.getClosestPoint(id);
          if (pointId)
            commands.push(
              new AddLineCommand({
                id: generateId(),
                startPointId: id,
                endPointId: pointId,
              }),
            );
        });
        this.context.executeCommand(new CompositeCommand(commands));
      } else {
        this.context.pointRenderer.setInvalid([...singleConn, ...noConn]);
        return;
      }
    }

    //2 Check Lines
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
        this.splitLines();
      } else {
        this.context.lineRenderer.setInvalid(uniqueIds);
        return;
      }
    }

    //3 check polygons
    let polygons = findPoygons(this.points, this.lines);
    let invalidPolygons: Vertex[][] = [];
    let invalidVertecies: string[] = [];
    polygons.forEach((polygon) => {
      if (isConcave(this.toPositions(polygon))) {
        invalidPolygons.push(insetPolygon(polygon, 0.1));
      }
      invalidVertecies.push(...findConcaveVertices(polygon));
    });

    if (invalidPolygons.length > 0) {
      const result = await showDialog({
        type: "confirm",
        message: "Polygons sollten Konvex sein",
        cancelText: "Abbrechen",
        confirmText: "Trotzdem Vorschau generieren",
      });
      if (result) {
        //Do something to the meshes
      } else {
        const invalids = this.getPolygonMeshes(invalidPolygons, 0.5, 0x000000);
        invalids.forEach((mesh) => {
          mesh.position.z -= 1.0;
          scene.add(mesh);
          this.previewMeshes.push(mesh);
        });
        this.context.pointRenderer.setInvalid(invalidVertecies);
        return;
      }
    }

    let inset = insetPolygons(polygons, 0.1);
    const elems = this.getPolygonMeshes(inset, 1.8);
    const back = this.getPolygonMeshes(polygons, 0.3, 0x000000);

    back.forEach((mesh) => {
      mesh.position.z += 1.0;
      scene.add(mesh);
      this.previewMeshes.push(mesh);
    });
    elems.forEach((mesh) => {
      mesh.position.z += 1.3;
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

  getPolygonMeshes(faces: Vertex[][], height = 1.8, color?: number) {
    let meshes = [];
    const texture = new THREE.TextureLoader().load("/textures/fichte.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.2, 0.2);

    for (const face of faces) {
      if (face.length < 3) continue;

      // Create shape from polygon
      const shape = new THREE.Shape();
      shape.moveTo(face[0].position.x, face[0].position.y);

      for (let i = 1; i < face.length; i++) {
        shape.lineTo(face[i].position.x, face[i].position.y);
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

  splitLines() {
    const intersections = findLineIntersections(this.points, this.lines);
    const deleteCommands: Command[] = [];
    const addCommands: Command[] = [];

    const intersectionsByLine = new Map<string, THREE.Vector3[]>();

    // Group
    intersections.forEach((i) => {
      if (!intersectionsByLine.has(i.line1Id)) {
        intersectionsByLine.set(i.line1Id, []);
      }
      if (!intersectionsByLine.has(i.line2Id)) {
        intersectionsByLine.set(i.line2Id, []);
      }

      intersectionsByLine.get(i.line1Id)!.push(i.point);
      intersectionsByLine.get(i.line2Id)!.push(i.point);
    });

    const pointMap = new Map<string, string>(); // key -> pointId
    const getPointKey = (p: THREE.Vector3) =>
      `${p.x.toFixed(6)}_${p.y.toFixed(6)}`;
    this.context.model.points.forEach((p) => {
      const key = getPointKey(new THREE.Vector3(p.x, p.y, p.z));
      pointMap.set(key, p.id);
    });

    const getOrCreatePointId = (p: THREE.Vector3): string => {
      const key = getPointKey(p);

      if (pointMap.has(key)) {
        return pointMap.get(key)!;
      }

      const id = generateId();
      pointMap.set(key, id);

      addCommands.push(new AddPointCommand({ id, x: p.x, y: p.y, z: 0 }));

      return id;
    };

    // Process each line
    intersectionsByLine.forEach((points, lineId) => {
      const line = this.context.model.lines.get(lineId);
      if (!line) return;
      const lineStart = this.context.pointRenderer.getWorldPosition(
        line.startPointId,
      );
      const lineEnd = this.context.pointRenderer.getWorldPosition(
        line.endPointId,
      );
      if (!lineStart || !lineEnd) {
        return;
      }

      // Include endpoints
      const allPoints = [lineStart, ...points, lineEnd];

      // Remove duplicates
      const unique = this.dedupePoints(allPoints);

      // Sort along line
      unique.sort(
        (a, b) =>
          this.getT(lineStart, lineEnd, a) - this.getT(lineStart, lineEnd, b),
      );

      // Create segments
      for (let i = 0; i < unique.length - 1; i++) {
        const p1 = unique[i];
        const p2 = unique[i + 1];

        if (this.pointsEqual(p1, p2)) continue;

        const id1 = getOrCreatePointId(p1);
        const id2 = getOrCreatePointId(p2);
        const newLineId = generateId();
        addCommands.push(
          new AddLineCommand({
            id: newLineId,
            startPointId: id1,
            endPointId: id2,
          }),
        );
      }

      // Remove original line
      deleteCommands.push(new DeleteLineCommand(lineId));
    });

    this.context.executeCommand(new CompositeCommand([...deleteCommands, ...addCommands]));
  }
  dedupePoints(points: THREE.Vector3[]): THREE.Vector3[] {
    const result: THREE.Vector3[] = [];

    points.forEach((p) => {
      if (!result.some((r) => this.pointsEqual(r, p))) {
        result.push(p);
      }
    });

    return result;
  }
  pointsEqual(a: THREE.Vector3, b: THREE.Vector3, eps = 1e-6): boolean {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
  }
  getT(
    linestart: THREE.Vector3,
    lineend: THREE.Vector3,
    p: THREE.Vector3,
  ): number {
    const dx = lineend.x - linestart.x;
    const dy = lineend.y - linestart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return (p.x - linestart.x) / dx;
    } else {
      return (p.y - linestart.y) / dy;
    }
  }
  getClosestPoint(id: string) {
    let closest = null;
    let minDist = Number.MAX_SAFE_INTEGER;
    const point = this.context.model.points.get(id);
    if (!point) return;
    this.context.model.points.forEach((p, pid) => {
      if (pid == id || this.context.lineRenderer.hasLineBetween(pid, id)) return;
      const x2 = p.x;
      const y2 = p.y;
      if (
        (point.x - x2) * (point.x - x2) + (point.y - y2) * (point.y - y2) <
        minDist
      ) {
        minDist =
          (point.x - x2) * (point.x - x2) + (point.y - y2) * (point.y - y2);
        closest = pid;
      }
    });
    return closest;
  }

  clearPreview() {
    this.context.pointRenderer.setInvalid([]);
    this.context.lineRenderer.setInvalid([]);
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
}
