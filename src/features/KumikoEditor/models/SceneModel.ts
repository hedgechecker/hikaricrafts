import type { PatternData } from "./Pattern";

/**
 * Manages the internal current State of the Project
 */
export class SceneModel {
  /** current PointData */
  patterns = new Map<string, PatternData>();
}
