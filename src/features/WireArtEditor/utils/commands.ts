import * as THREE from "three";
import { AddLineCommand } from "../commands/AddLineCommand";
import { AddPointCommand } from "../commands/AddPointCommand";
import { CompositeCommand } from "../commands/CompositeCommand";
import { DeleteLineCommand } from "../commands/DeleteLineCommand";
import { generateId } from "./id";
import { projectPointToSegment } from "./math";
import type { LineData } from "../models/Line";
import type { PointRenderer } from "../objects/Renderer/PointRenderer";
import { getSegmentIntersection } from "./graphs";

/**
 * Manages the splitting of an existing Line
 * @param worldPos The Point in Space, wich gets projected onto the Line
 * @param line the Line to be split
 * @param pointManager To get the WorldPosition of the points
 * @returns command: the SplitCommand , id: the Id of the newly created Point
 */
export function splitLine(
  worldPos: THREE.Vector3,
  line: LineData,
  pointManager: PointRenderer,
  line2?: LineData,
) {
  if (line2) {
    const aPos = pointManager.getWorldPosition(line.startPointId)!;
    const bPos = pointManager.getWorldPosition(line.endPointId)!;
    const cPos = pointManager.getWorldPosition(line2.startPointId)!;
    const dPos = pointManager.getWorldPosition(line2.endPointId)!;
    const endPos = getSegmentIntersection(
      new THREE.Vector2(aPos.x, aPos.y),
      new THREE.Vector2(bPos.x, bPos.y),
      new THREE.Vector2(cPos.x, cPos.y),
      new THREE.Vector2(dPos.x, dPos.y),
    );
    if (!endPos) return null;
    const newPointId = generateId();
    const newPoint = {
      id: newPointId,
      x: endPos[0].x,
      y: endPos[0].y,
      z: 0,
    };

    const splitCommand = new CompositeCommand([
      new AddPointCommand(newPoint),
      new DeleteLineCommand(line.id),
      new DeleteLineCommand(line2.id),
      new AddLineCommand({
        id: generateId(),
        startPointId: line.startPointId,
        endPointId: newPointId,
      }),
      new AddLineCommand({
        id: generateId(),
        startPointId: newPointId,
        endPointId: line.endPointId,
      }),
      new AddLineCommand({
        id: generateId(),
        startPointId: line2.startPointId,
        endPointId: newPointId,
      }),
      new AddLineCommand({
        id: generateId(),
        startPointId: newPointId,
        endPointId: line2.endPointId,
      }),
    ]);
    return { command: splitCommand, pointId: newPointId };
  }

  //Add a new Point on an existing line
  const aPos = pointManager.getWorldPosition(line.startPointId);
  const bPos = pointManager.getWorldPosition(line.endPointId);
  if (!aPos || !bPos) return null;

  const a = aPos.clone();
  const b = bPos.clone();
  worldPos = projectPointToSegment(worldPos, a, b);

  const newPointId = generateId();
  const newPoint = {
    id: newPointId,
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
  };

  // prevent splitting exactly at endpoints
  if (worldPos.distanceTo(a) < 0.001 || worldPos.distanceTo(b) < 0.001) {
    return null;
  }

  const splitCommand = new CompositeCommand([
    new AddPointCommand(newPoint),
    new DeleteLineCommand(line.id),
    new AddLineCommand({
      id: generateId(),
      startPointId: line.startPointId,
      endPointId: newPointId,
    }),
    new AddLineCommand({
      id: generateId(),
      startPointId: newPointId,
      endPointId: line.endPointId,
    }),
  ]);
  return { command: splitCommand, pointId: newPointId };
}
