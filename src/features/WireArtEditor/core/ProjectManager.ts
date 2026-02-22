import type { Project, PointData, LineData } from '../models/Project';
import { generateId } from '../utils/id.ts';
export class ProjectManager {
  private project: Project;

  constructor() {
    this.project = this.createEmptyProject();
  }

  private createEmptyProject(): Project {
    return {
      id: generateId(),
      name: 'Untitled Project',
      version: 1,
      points: [],
      lines: [],
    };
  }

  getProject() {
    return this.project;
  }

  setBackground(image: string) {
    this.project.backgroundImage = image;
  }

  addPoint(x: number, y: number): PointData {
    const point: PointData = {
      id: generateId(),
      x,
      y,
    };

    this.project.points.push(point);
    return point;
  }

  getPointById(id: string) {
    return this.project.points.find((p) => p.id === id) ?? null;
  }

  addLine(startId: string, endId: string): LineData {
    const line: LineData = {
      id: generateId(),
      startPointId: startId,
      endPointId: endId,
    };

    this.project.lines.push(line);
    return line;
  }

  movePoint(id: string, x: number, y: number) {
    const point = this.project.points.find((p) => p.id === id);
    if (!point) return;

    point.x = x;
    point.y = y;
    return point;
  }

  export(): string {
    return JSON.stringify(this.project, null, 2);
  }

  import(json: string) {
    this.project = JSON.parse(json);
  }

  dispose() {
    this.project = this.createEmptyProject();
  }
}
