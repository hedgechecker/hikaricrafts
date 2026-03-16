import type { Project } from '../models/Project';
const BASE_URL = import.meta.env.VITE_API_URL;
const LOCALSTORAGE_KEY = 'Project';

export class DataStorage {
  /**
   * @returns a clean new Project
   */
  getEmptyProject(): Project {
    return {
      points: [],
      lines: [],
      images: [],
      id: null,
      name: '',
      version: 0,
      settings: {
        showPoints: true,
        showLines: true,
        showGrid: true,
        showImage: true,
        snapToGrid: true,
        lineColor: '#000000',
        pointColor: '#999999',
      },
    };
  }

  //Local storing of the Project
  saveToLocal(data: Project): void {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  }
  loadFromLocal(): Project | null {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Project;
  }
  deleteLocal(): void {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  }

  //Global storing of the Project
  /**
   * Saves a project to the backend.
   *
   * - If the user is not authenticated, saving is aborted.
   * - If the project already has an ID, it will be updated instead of created.
   * - Otherwise a new project is created via the API.
   *
   * Returns the saved project (including generated id).
   */
  async saveGlobal(project: Project): Promise<Project | null> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('User not Logged In: No Global Storage');
      return null;
    }

    // Update existing project
    if (project.id) {
      const success = await this.updateGlobal(project);
      return success ? project : null;
    }

    if (project.name.length < 1) {
      window.alert('Projekt bennen');
    }

    console.log('Creating new project');

    const data = {
      points: project.points,
      lines: project.lines,
      images: project.images,
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

    if (!res.ok) {
      console.error('Failed to create project');
      return null;
    }

    const created = await res.json();
    // return a new object so stores/react detect the change
    return {
      ...project,
      id: created.id,
    };

  }
  /**
   *
   * @param project the Project to be Updated
   * @returns if Updating was successfull
   */
  async updateGlobal(project: Project): Promise<boolean> {
    const token = localStorage.getItem('token');

    if (!project.id) {
      console.error('Cannot update project without id');
      return false;
    }

    const data = {
      points: project.points,
      lines: project.lines,
      images: project.images,
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
      return false;
    }

    const updatedProject = await response.json();
    console.log('Project updated:', updatedProject);
    return true;
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
      images: data.images,
      settings: data.settings,
    };
  }
}
