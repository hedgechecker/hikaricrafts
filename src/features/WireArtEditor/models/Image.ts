/**
 * Represents a Image relative in the editor.
 */
export interface ImageData {
  /** Unique identifier */
  id: string;

  /** The Image display data */
  url: string;

  /** Position X */
  x: number;
  /** Position Y */
  y: number;
  /** Position Z */
  z: number;

  /** rotation in PI */
  rotation: number;
  /** height of the stretched image*/
  height: number;
}
