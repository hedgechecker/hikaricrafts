/** Manages the Project-specific settings */
export interface Settings {
  /** If Points should be currently shown */
  showPoints: boolean;
  /** If Lines should be currently shown */
  showLines: boolean;
  /** If the Grid should be currently shown */
  showGrid: boolean;
  /** If Images should be currently shown */
  showImage: boolean;
  /** If placement should snap to the shown Grid */
  snapToGrid: boolean;
  /** color of Lines*/
  lineColor: string;
  /** color of Points*/
  pointColor: string;
}
