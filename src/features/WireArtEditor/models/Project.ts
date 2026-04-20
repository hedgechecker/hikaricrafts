import type { LineData } from "./Line";
import type { PointData } from "./Point";
import type { ImageData } from './Image';
import type { Settings } from "./Settings";
import type { Vector3 } from "three";

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
  points: PointData[];
  /** All of the Lines to be rendered*/
  lines: LineData[];
  /** All of the Images to be rendered*/
  images: ImageData[];

  /** The custom settings for display actions*/
  settings: Settings;

  /** The last saved ViewPoint for easy project switch*/
  viewPoint?: {pos: Vector3, zoom: number}
}