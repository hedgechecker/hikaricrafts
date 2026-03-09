import type { Project } from '../models/DataModel';
const BASE_URL = import.meta.env.VITE_API_URL;

export class DataStorage {
  getEmptyProject() {
    return {
      points: [],
      lines: [],
      id: null,
      name: '',
      version: 0,
      settings: {
        showPoints: true,
        showLines: true,
        showGrid: true,
        showImage: true,
        snapToGrid: true,
        lineColor: '#999999',
        pointColor: '#999999',
      },
    } as Project;
  }

  saveToLocal(data: Project) {
    localStorage.setItem('X', JSON.stringify(data));
  }

  loadFromLocal(): Project | null {
    const raw = localStorage.getItem('X');
    if (!raw) return null;

    return JSON.parse(raw) as Project;
  }
  deleteLocal() {
    localStorage.removeItem('X');
  }

  async saveGlobal(project: Project) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not Logged In: No Global Storage');
      return;
    }

    if (project.id) {
      await this.updateGlobal(project);
      return;
    }

    if (project.name.length < 1) {
      window.alert('Projekt bennen');
    }

    console.log('Creating new project');

    const data = {
      points: project.points,
      lines: project.lines,
      background: project.background,
      settings: project.settings,
    };

    const res = await fetch(`${BASE_URL}/wireArtProjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: project.name,
        data,
        isPublic: false,
      }),
    });

    const created = await res.json();

    project.id = created.id;
  }

  async updateGlobal(project: Project) {
    const token = localStorage.getItem('token');

    if (!project.id) {
      console.error('Cannot update project without id');
      return;
    }

    const data = {
      points: project.points,
      lines: project.lines,
      background: project.background,
      settings: project.settings,
    };

    const response = await fetch(`${BASE_URL}/wireArtProjects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: project.name,
        data,
        isPublic: project.isPublic ?? false,
        version: project.version,
      }),
    });

    if (!response.ok) {
      console.error('Failed to update project');
      return;
    }

    const updatedProject = await response.json();

    console.log('Project updated:', updatedProject);
  }

  async loadGlobal(id: number): Promise<Project | null> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/wireArtProjects/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to load project');
      return null;
    }

    const project = await response.json();
    const data = project.data;

    return {
      version: project.version,
      id: project.id,
      name: project.name,
      isPublic: project.isPublic,
      points: data.points,
      lines: data.lines,
      background: data.background,
      settings: data.settings,
    };
  }
}
