export interface Tool {
  onMouseDown?(event: MouseEvent): void;
  onMouseMove?(event: MouseEvent): void;
  onMouseUp?(event: MouseEvent): void;
  onClick?(event: MouseEvent): void;
  dispose?(): void;
}
