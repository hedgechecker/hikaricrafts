/**
 * @var width the width of the Panel
 * @var height the height of the Panel
 * @var depth the depth of the Panel
 * @var frameWidth the Frame thickness
 * @var lineWidth width of single wood strips
 * @var spacing the ground side of each triangle
 */
export interface PanelConfig {
  width: number;
  height: number;
  depth: number;
  frameWidth: number;
  lineWidth: number;
  spacing: number;
}

/**
 * @var depth the depth of the Panel
 * @var lineWidth width of single wood strips
 * @var spacing the ground side of each triangle
 */
export interface PatternConfig {
  depth: number;
  lineWidth: number;
  spacing: number;
}


export interface singlePattern {
  rotation: number;
  patternIndex: number;
  materialMap: number[];
}

export interface gridPosition {
  x: number;
  y: number;
  z: number;
}

export interface scenePosition {
  pos: { x: number; y: number; z: number };
  rotation: number;
}
