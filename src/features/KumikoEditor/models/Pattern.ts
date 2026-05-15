/**
 * Represents a Pattern relative in the editor.
 */
export interface PatternData {
  /** Unique identifier */
  id: string;

  /** The type of pattern*/
  patternType: patternType;
  /** Position*/
  pos: PatternPos;

  /** Matches the style to every single wooden piece per pattern */
  materialMap: { woodType: WoodType, thickness: number }[];
}

export interface PatternPos {
  x: number;
  /** Position Y */
  y: number;
  /** Position Z */
  z: number;
  /** Rotation of the triangle (can only have three rotations)*/
  rotation: 0 | 1 | 2;
}

export type WoodType = "Oak" | "Pine" | "DouglasFir";
export type patternType = "AsaNoHa" | "Gomagara" | "Mystery";
