/**
 * Represents a line between two points in the editor.
 */
export interface LineData {
  /** Unique identifier */
  id: string;

  /** Id of the starting point */
  startPointId: string;

  /** Id of the ending point */
  endPointId: string;
}
