import * as THREE from "three";
import type { PatternConfig } from "../Utils/InterfaceUtils";
import { getFastMaterial, getOpaqueMaterial } from "./Materials";
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
) {
  let mesh: THREE.Group;
  switch (pattern) {
    case -1:
      //for the PatternPanel Empty Pattern
      mesh = createOutline(config);
      break;
    case 0:
      //for the eraser Tool
      mesh = new THREE.Group();
      break;
    case 1:
      mesh = createAsaNoHa(config, pattern, opaque, materialMap? materialMap:undefined);
      break;
    case 2:
      mesh = createGomaGara(config, pattern, opaque, materialMap? materialMap:undefined);
      break;
    default:
      mesh = createAsaNoHa(config, pattern, opaque);
      break;
  }
  return mesh as THREE.Group;
}

/**
 *
 * @param dimensions includes the needed dimensions { spacing, lineWidth, depth }
 * @returns a mesh group with half the linewidth (could be used to create a grid with the actual linewidth)
 */
function createOutline({ spacing, lineWidth, depth }: PatternConfig) {
  const triangleHeight = Math.sqrt(
    spacing * spacing - ((spacing / 2) * spacing) / 2
  );
  const l = lineWidth / 2;

  const inward = (l * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

  //a single side
  const shape = new THREE.Shape();
  shape.moveTo(-spacing / 2, -triangleHeight * (1 / 3));
  shape.lineTo(spacing / 2, -triangleHeight * (1 / 3));
  shape.lineTo((spacing - 2 * inward) / 2, -triangleHeight * (1 / 3) + l);
  shape.lineTo(-(spacing - 2 * inward) / 2, -triangleHeight * (1 / 3) + l);
  shape.lineTo(-spacing / 2, -triangleHeight * (1 / 3));

  const part1 = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
  });

  const group = new THREE.Group();

  const material = getOpaqueMaterial(0);

  const mesh1 = new THREE.Mesh(part1, material);
  const mesh2 = mesh1.clone();
  mesh2.rotation.z = Math.PI * (2 / 3);
  const mesh3 = mesh1.clone();
  mesh3.rotation.z = Math.PI * (4 / 3);

  group.add(mesh1, mesh2, mesh3);
  return group;
}

/**
 * @param config the standard dimensions
 * @param index the index of this Pattern
 * @param [opaque=false] return a opaque pattern
 * @returns a AsaNoHa Pattern
 */
function createAsaNoHa(
  config: PatternConfig,
  index: number,
  opaque = false,
  materialMap?: number[]
) {
  const shape = new THREE.Shape();
  const points = getPatternPoints(index, config) as THREE.Vector2[];
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }

  const part1 = new THREE.ExtrudeGeometry(shape, {
    depth: config.depth,
    bevelEnabled: false,
  });
  const part2 = part1.clone();
  part2.rotateZ(Math.PI * (2 / 3));

  const part3 = part1.clone();
  part3.rotateZ(Math.PI * (4 / 3));

  const group = new THREE.Group();

  group.add(
    new THREE.Mesh(
      part1,
      opaque
        ? getOpaqueMaterial(materialMap ? materialMap[0] : 0)
        : getFastMaterial(materialMap ? materialMap[0] : 0)
    ),
    new THREE.Mesh(
      part2,
      opaque
        ? getOpaqueMaterial(materialMap ? materialMap[1] : 0)
        : getFastMaterial(materialMap ? materialMap[1] : 0)
    ),
    new THREE.Mesh(
      part3,
      opaque
        ? getOpaqueMaterial(materialMap ? materialMap[2] : 0)
        : getFastMaterial(materialMap ? materialMap[2] : 0)
    )
  );

  return group;
}

/**
 * @param config the standard dimensions
 * @param index the index of this Pattern
 * @param [opaque=false] return a opaque pattern
 * @returns a GomaGara Pattern
 */
function createGomaGara(
  config: PatternConfig,
  index: number,
  opaque = false,
  materialMap?: number[]
) {
  const shape = new THREE.Shape();
  const points = getPatternPoints(index, config) as THREE.Vector2[];
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }

  const part1 = new THREE.ExtrudeGeometry(shape, {
    depth: config.depth,
    bevelEnabled: false,
  });


  const mesh1 = new THREE.Mesh(
    part1,
    opaque
      ? getOpaqueMaterial(materialMap ? materialMap[0] : 0)
      : getFastMaterial(materialMap ? materialMap[0] : 0)
  );

  const part2 = part1.clone();
  part2.rotateZ(Math.PI * (2 / 3));
  const mesh2 = new THREE.Mesh(
    part2,
    opaque
      ? getOpaqueMaterial(materialMap ? materialMap[1] : 0)
      : getFastMaterial(materialMap ? materialMap[1] : 0)
  );
  mesh2.position.z = -0.05;

  const part3 = part1.clone();
  part3.rotateZ(Math.PI * (4 / 3));
  const mesh3 = new THREE.Mesh(
    part3,
    opaque
      ? getOpaqueMaterial(materialMap ? materialMap[2] : 0)
      : getFastMaterial(materialMap ? materialMap[2] : 0)
  );
  mesh2.position.z = -0.1;

  const group = new THREE.Group();
  group.add(mesh1, mesh2, mesh3);
  return group;
}
/**
 *
 * @param index the index of the pattern
 * @param config includes the dimensions {spacing, lineWidth}
 * @returns a Array of Points of the Polygon first and last point is the same
 */
export function getPatternPoints(
  index: number,
  { spacing, lineWidth }: PatternConfig
) {
  const triangleHeight = Math.sqrt(
    spacing * spacing - ((spacing / 2) * spacing) / 2
  );
  //height, when the thickness of material is deducted
  const innerheight = triangleHeight - (3 * lineWidth) / 2;
  switch (index) {
    case 0:
      return [] as THREE.Vector2[];
    case 1:
      const bottomAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 3);
      const topAngleHeight =
        ((lineWidth / 2) * Math.sin(Math.PI / 3)) / Math.sin(Math.PI / 6);

      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(
          lineWidth / 2,
          innerheight * (2 / 3) - topAngleHeight
        ),
        new THREE.Vector2(0, innerheight * (2 / 3)),
        new THREE.Vector2(
          -lineWidth / 2,
          innerheight * (2 / 3) - topAngleHeight
        ),
        new THREE.Vector2(-lineWidth / 2, bottomAngleHeight),
        new THREE.Vector2(0, 0),
      ] as THREE.Vector2[];
      break;
    case 2:
      const bottom = -innerheight * (1 / 3) + lineWidth;
      //b = a × sin beta / sin alpha
      const b =
        ((innerheight - (innerheight * (1 / 3) + bottom)) *
          Math.sin(Math.PI / 2)) /
        Math.sin(Math.PI / 3);
      //c = b × sin gamma / sin beta
      const leftlength = (b * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      const b2 =
        (lineWidth * 2 * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 3);
      //c = b × sin gamma / sin beta
      const leftTopDelta = (b2 * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

      return [
        new THREE.Vector2(-leftlength, bottom),
        new THREE.Vector2(-leftlength + leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftlength - leftTopDelta / 2, bottom + lineWidth),
        new THREE.Vector2(leftlength, bottom),
        new THREE.Vector2(-leftlength, bottom),
      ] as THREE.Vector2[];

      break;

    default:
      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
      ] as THREE.Vector2[];
      break;
  }
}
