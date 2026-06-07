import * as THREE from "three";
import { getFastMaterial } from "./materials";
import type { Settings } from "../models/Settings";
import type { PatternData, patternType } from "../models/Pattern";

/**
 * @param pattern the index of the wanted pattern
 * @param settings includes the needed dimensions {spacing, lineWidth, depth}
 * @param materialMap array of the materials
 * @returns a THREE.Group of the colorizable meshes
 */
export function createPattern(
  pattern: PatternData,
  settings: Settings,
  opaque = false,
): THREE.Group {
  const factories: Record<patternType, () => THREE.Group> = {
    ["Mystery"]: () => createOutline(settings),
    ["AsaNoHa"]: () => createPatternGroup(pattern, settings, opaque),
    ["Gomagara"]: () => createPatternGroup(pattern, settings, opaque),
    ["Outline"]: () => createOutline(settings),
  };

  const factory = factories[pattern.patternType] ?? factories["Gomagara"];
  return factory();
}

/**
 * Create a generic pattern group
 */
function createPatternGroup(
  pattern: PatternData,
  settings: Settings,
  opaque: boolean,
): THREE.Group {
  const points = getPatternPoints(pattern.patternType, settings);
  const shape = createShapeFromPoints(points);
  const baseGeo = new THREE.ExtrudeGeometry(shape, {
    depth: settings.depth,
    bevelEnabled: false,
  });

  const group = new THREE.Group();
  const rotations = [0, Math.PI * (2 / 3), Math.PI * (4 / 3)];

  rotations.forEach((rot, i) => {
    const geo = baseGeo.clone();
    geo.rotateZ(rot);
    const material = getFastMaterial(
      pattern.materialMap[i] ? pattern.materialMap[i].woodType : "Fichte",
      opaque,
    );
    const mesh = new THREE.Mesh(geo, material);

    // GomaGara only: offset z slightly for each layer
    if (pattern.patternType === "Gomagara") mesh.position.z = -i * 0.05;

    group.add(mesh);
  });

  //Create the Hitbox outline
  const hitshape = createShapeFromPoints(getPatternPoints("Mystery", settings));
  const hitGeometry = new THREE.ExtrudeGeometry(hitshape, {
    depth: settings.depth,
    bevelEnabled: false,
  });
  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    color: 0xff0000,
    depthWrite: false,
  });
  const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
  hitbox.name = "hitbox";
  group.add(hitbox);

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
function createOutline({ spacing, lineWidth, depth }: Settings): THREE.Group {
  const triangleHeight = Math.sqrt(
    spacing ** 2 - ((spacing / 2) * spacing) / 2,
  );
  const l = lineWidth / 2;
  const inward = (l * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

  const shape = new THREE.Shape();
  shape.moveTo(-spacing / 2, -triangleHeight / 3);
  shape.lineTo(spacing / 2, -triangleHeight / 3);
  shape.lineTo((spacing - 2 * inward) / 2, -triangleHeight / 3 + l);
  shape.lineTo(-(spacing - 2 * inward) / 2, -triangleHeight / 3 + l);
  shape.lineTo(-spacing / 2, -triangleHeight / 3);

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const material = getFastMaterial("Fichte", true);

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
  type: patternType,
  { spacing, lineWidth }: Settings,
): THREE.Vector2[] {
  const triangleHeight = Math.sqrt(
    spacing ** 2 - ((spacing / 2) * spacing) / 2,
  );
  const innerHeight = triangleHeight - (3 * lineWidth) / 2;

  switch (type) {
    case "Gomagara": {
      const bottomAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 3);
      const topAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(
          lineWidth / 2,
          innerHeight * (2 / 3) - topAngleHeight,
        ),
        new THREE.Vector2(0, innerHeight * (2 / 3)),
        new THREE.Vector2(
          -lineWidth / 2,
          innerHeight * (2 / 3) - topAngleHeight,
        ),
        new THREE.Vector2(-lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(0, 0),
      ];
    }

    case "AsaNoHa": {
      const bottom = -innerHeight / 3 + lineWidth;
      const b =
        ((innerHeight - (innerHeight / 3 + bottom)) * Math.sin(Math.PI / 2)) /
        Math.sin(Math.PI / 3);
      const leftLength = (b * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      const b2 =
        (lineWidth * 2 * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 3);
      const leftTopDelta = (b2 * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      return [
        new THREE.Vector2(-leftLength, bottom),
        new THREE.Vector2(-leftLength + leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftLength - leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftLength, bottom),
        new THREE.Vector2(-leftLength, bottom),
      ];
    }

    //Return Hitbox Outline
    default:
      return [
        new THREE.Vector2(-triangleHeight / 2, (-innerHeight * 1) / 3),
        new THREE.Vector2(triangleHeight / 2, (-innerHeight * 1) / 3),
        new THREE.Vector2(0, (innerHeight * 2) / 3),
        new THREE.Vector2(-triangleHeight / 2, (-innerHeight * 1) / 3),
      ];
  }
}
