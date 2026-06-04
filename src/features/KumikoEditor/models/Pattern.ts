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
  materialMap: { woodType: woodType; thickness: number }[];
}

export interface PatternPos {
  x: number;
  /** Position Y */
  y: number;
  /** Position Z */
  z: number;
  /** Rotation of the triangle (can only have six rotations)*/
  rotation: 0 | 1 | 2 | 3 | 4 | 5;
}

export const WOODTYPE = ["Fichte", "Eiche", "Douglasie"] as const;
export const PATTERNS = ["AsaNoHa", "Gomagara", "Outline", "Mystery"] as const;
export type patternType = (typeof PATTERNS)[number];
export type woodType = (typeof WOODTYPE)[number];
