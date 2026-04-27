import type { Settings } from "./Settings";
import type { Vector3 } from "three";
import type { PatternData } from "./Pattern";

export interface Project {
  /** Unique identifier */
  id: number | null;
  /** Display name of the Project */
  name: string;
  /** The current Version of the Project */
  version: number;
  /** If the project can be accessed by anyone */
  isPublic?: boolean;

  /** All of the Points to be rendered*/
  patterns: PatternData[];

  /** The custom settings for display actions*/
  settings: Settings;

  /** The last saved ViewPoint for easy project switch*/
  viewPoint?: {pos: Vector3, zoom: number}
}