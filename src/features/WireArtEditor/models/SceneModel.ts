import type { LineData } from './Line';
import type { PointData } from './Point';
import type { ImageData } from './Image';

export class SceneModel {
  points = new Map<string, PointData>();
  lines = new Map<string, LineData>();
  images = new Map<string, ImageData>();
}