import * as THREE from 'three';
import { AddLineCommand } from '../commands/AddLineCommand';
import { AddPointCommand } from '../commands/AddPointCommand';
import { CompositeCommand } from '../commands/CompositeCommand';
import { DeleteLineCommand } from '../commands/DeleteLineCommand';
import { generateId } from './id';
import { projectPointToSegment } from './math';
import type { LineData } from '../models/Line';
import type { PointRenderer } from '../objects/PointRenderer';


/**
 * Manages the splitting of an existing Line
 * @param worldPos The Point in Space, wich gets projected onto the Line
 * @param line the Line to be split
 * @param pointManager To get the WorldPosition of the points
 * @returns command: the SplitCommand , id: the Id of the newly created Point
 */
export function splitLine(worldPos: THREE.Vector3, line: LineData, pointManager: PointRenderer) {
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
    new AddLineCommand({ id: generateId(), startPointId: newPointId, endPointId: line.endPointId }),
  ]);
  return { command: splitCommand, pointId: newPointId };
}
