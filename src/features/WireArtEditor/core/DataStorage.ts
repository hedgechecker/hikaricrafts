import type { LineData, PointData, Project } from '../models/Project';
import { generateId } from '../utils/id';

export class DataStorage {
  private project: Project;

  constructor() {
    this.project = {
      id: generateId(),
      name: 'Untitled Project',
      version: 0,
      points: new Map<string, PointData>(),
      lines: new Map<string, LineData>(),
    };
  }

  loadFromLocal(projectName: string) {
    const data = localStorage.getItem(projectName);
    if (!data) return;
    this.project = JSON.parse(data);
  }

  saveToLocal(projectName: string) {
    localStorage.setItem(projectName, JSON.stringify(this.project));
  }

  getPoints() {
    return this.project.points;
  }

  getLines() {
    return this.project.lines;
  }

  getBackground() {
    return this.project.backgroundImage;
  }

  addPoint(point: PointData, id: string) {
    this.project.points.set(id, point);
  }

  addLine(line: LineData, id: string) {
    this.project.lines.set(id, line);
  }

  setBackground(url: string) {
    this.project.backgroundImage = url;
  }
}
