import * as THREE from "three";
import type { PatternConfig } from "../Utils/InterfaceUtils";
import { getFastMaterial } from "./Materials";

/**
 * @param pattern the index of the wanted pattern
 * @param config includes the needed dimensions {spacing, lineWidth, depth}
 * @param materialMap array of the materials
 * @returns a THREE.Group of the colorizable meshes
 */
export function createPattern(
  pattern: number,
  config: PatternConfig,
  opaque = false,
  materialMap?: number[]
): THREE.Group {
  const factories: Record<number, () => THREE.Group> = {
    [-1]: () => createOutline(config),
    [0]: () => new THREE.Group(),
    [1]: () => createPatternGroup("AsaNoHa", config, pattern, opaque, materialMap),
    [2]: () => createPatternGroup("GomaGara", config, pattern, opaque, materialMap),
  };

  const factory = factories[pattern] ?? factories[1];
  return factory();
}

/**
 * Create a generic pattern group (AsaNoHa or GomaGara)
 */
function createPatternGroup(
  type: "AsaNoHa" | "GomaGara",
  config: PatternConfig,
  index: number,
  opaque: boolean,
  materialMap?: number[]
): THREE.Group {
  const shape = createShapeFromPoints(getPatternPoints(index, config));
  const baseGeo = new THREE.ExtrudeGeometry(shape, {
    depth: config.depth,
    bevelEnabled: false,
  });

  const group = new THREE.Group();
  const rotations = [0, Math.PI * (2 / 3), Math.PI * (4 / 3)];

  rotations.forEach((rot, i) => {
    const geo = baseGeo.clone();
    geo.rotateZ(rot);

    const mesh = new THREE.Mesh(
      geo,
      getFastMaterial(materialMap?.[i] ?? 0, opaque)
    );

    // GomaGara only: offset z slightly for each layer
    if (type === "GomaGara") mesh.position.z = -i * 0.05;

    group.add(mesh);
  });

  return group;
}

/**
 * Helper to create a Shape from a list of points.
 */
function createShapeFromPoints(points: THREE.Vector2[]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length === 0) return shape;

  shape.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => shape.lineTo(p.x, p.y));

  return shape;
}

/**
 * Creates an outline pattern
 */
function createOutline({ spacing, lineWidth, depth }: PatternConfig): THREE.Group {
  const triangleHeight = Math.sqrt(spacing ** 2 - ((spacing / 2) * spacing) / 2);
  const l = lineWidth / 2;
  const inward = (l * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

  const shape = new THREE.Shape();
  shape.moveTo(-spacing / 2, -triangleHeight / 3);
  shape.lineTo(spacing / 2, -triangleHeight / 3);
  shape.lineTo((spacing - 2 * inward) / 2, -triangleHeight / 3 + l);
  shape.lineTo(-(spacing - 2 * inward) / 2, -triangleHeight / 3 + l);
  shape.lineTo(-spacing / 2, -triangleHeight / 3);

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const material = getFastMaterial(0, true);

  const group = new THREE.Group();
  [0, Math.PI * (2 / 3), Math.PI * (4 / 3)].forEach((rot) => {
    const mesh = new THREE.Mesh(geo.clone(), material);
    mesh.rotation.z = rot;
    group.add(mesh);
  });

  return group;
}

/**
 * Computes pattern points
 */
export function getPatternPoints(
  index: number,
  { spacing, lineWidth }: PatternConfig
): THREE.Vector2[] {
  const triangleHeight = Math.sqrt(spacing ** 2 - ((spacing / 2) * spacing) / 2);
  const innerHeight = triangleHeight - (3 * lineWidth) / 2;

  switch (index) {
    case 0:
      return [];

    case 1: {
      const bottomAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 3);
      const topAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(lineWidth / 2, innerHeight * (2 / 3) - topAngleHeight),
        new THREE.Vector2(0, innerHeight * (2 / 3)),
        new THREE.Vector2(-lineWidth / 2, innerHeight * (2 / 3) - topAngleHeight),
        new THREE.Vector2(-lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(0, 0),
      ];
    }

    case 2: {
      const bottom = -innerHeight / 3 + lineWidth;
      const b =
        ((innerHeight - (innerHeight / 3 + bottom)) * Math.sin(Math.PI / 2)) /
        Math.sin(Math.PI / 3);
      const leftLength = (b * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      const b2 = (lineWidth * 2 * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 3);
      const leftTopDelta = (b2 * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      return [
        new THREE.Vector2(-leftLength, bottom),
        new THREE.Vector2(-leftLength + leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftLength - leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftLength, bottom),
        new THREE.Vector2(-leftLength, bottom),
      ];
    }

    default:
      return [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)];
  }
}
