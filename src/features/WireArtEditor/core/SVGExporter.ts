import { SceneModel } from '../models/SceneModel';
import type { Project } from '../models/Project';

export class SVGExporter {
  public static simpleExport(model: SceneModel, project: Project) {
    const lines = Array.from(model.lines.values());
    if (lines.length === 0) return;

    const points = Array.from(model.points.values());

    // compute bounds
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const scale = 100; // adjust if needed
    const padding = 20;

    const width = (maxX - minX) * scale + padding * 2;
    const height = (maxY - minY) * scale + padding * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

    for (const line of lines) {
      const a = model.points.get(line.startPointId);
      const b = model.points.get(line.endPointId);
      if (!a || !b) continue;

      const x1 = (a.x - minX) * scale + padding;
      const y1 = height - ((a.y - minY) * scale + padding);
      const x2 = (b.x - minX) * scale + padding;
      const y2 = height - ((b.y - minY) * scale + padding);

      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="2"/>`;
    }

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = project.name + 'v' + project.version + '.svg';
    a.click();

    URL.revokeObjectURL(url);
  }
}
