import type { Project } from '../models/Project';
const BASE_URL = import.meta.env.VITE_API_URL;
const LOCALSTORAGE_KEY = "Project";

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
   * After creating a new project, the returned ID is written back to the
   * project object so future saves will update the existing project.
   */
  async saveGlobal(project: Project): Promise<boolean> {
    // Retrieve authentication token for API requests
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not Logged In: No Global Storage');
      return false;
    }

    // If the project already exists in the backend, update it instead
    if (project.id) {
      return await this.updateGlobal(project);
    }

    if (project.name.length < 1) {
      window.alert('Projekt bennen');
    }

    console.log('Creating new project');

    // Extract only the editor data that should be persisted
    const data = {
      points: project.points,
      lines: project.lines,
      images: project.images,
      settings: project.settings,
    };

    // Send request to create a new project in the backend
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

    // Read created project from API response
    const created = await res.json();

    // Store the generated project ID locally for future updates
    project.id = created.id;

    return true;
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
