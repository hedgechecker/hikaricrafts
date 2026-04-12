import { logError, logInfo, logWarn } from "../../../utils/error/errorHandler";
import type { Project } from "../models/Project";
//import CryptoJS from "crypto-js";

const BASE_URL = import.meta.env.VITE_API_URL;
const LOCALSTORAGE_KEY = "Project";
//const CRYPT_KEY = "ernieUndBert";

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
      name: "",
      version: 0,
      settings: {
        showPoints: true,
        showLines: true,
        showGrid: true,
        showImage: true,
        snapToGrid: true,
        lineColor: "#000000",
        pointColor: "#999999",
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
    const token = localStorage.getItem("token");

    if (!token) {
      logWarn("Global Saving aborted, User is not logged In", {
        function: "DataStorage/saveGlobal",
      });
      return null;
    }

    // Update existing project
    if (project.id) {
      const success = await this.updateGlobal(project);
      return success ? project : null;
    }

    logInfo("Creating new project");

    const data = {
      points: project.points,
      lines: project.lines,
      images: project.images,
      settings: project.settings,
    };

    const res = await fetch(`${BASE_URL}/wireArtProjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: project.name,
        data,
        isPublic: false,
      }),
    });

    if (!res.ok) {
      logError("Failed to create Project", {
        function: "DataStorage/saveGlobal",
        res: res,
      });
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
   * @param project the Project to be Updated
   * @returns if Updating was successfull
   */
  async updateGlobal(project: Project): Promise<boolean> {
    const token = localStorage.getItem("token");

    if (!project.id) {
      logError("Cannot update Project without ID", {
        function: "DataStorage/updateGlobal",
        project: project,
      });
      return false;
    }

    const data = {
      points: project.points,
      lines: project.lines,
      images: project.images,
      settings: project.settings,
    };

    const res = await fetch(`${BASE_URL}/wireArtProjects/${project.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: project.name,
        data,
        isPublic: project.isPublic ?? false,
        version: project.version,
      }),
    });

    if (!res.ok) {
      logWarn("Failed to update Project", {
        function: "DataStorage/updateGlobal",
        res: res,
        project: project,
      });
      return false;
    }

    const updatedProject = await res.json();
    logInfo("Project updated", {project:updatedProject});
    return true;
  }

  async renameProject(id: number, name: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/wireArtProjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: name }),
    });
    if (!res.ok) {
      logWarn("Failed to update Project", {
        function: "DataStorage/renameProject",
        res: res,
        id: id,
        name: name
      });
    }
  }

  async loadGlobal(id: number): Promise<Project | null> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/wireArtProjects/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      logWarn("Failed to load Project", {
        function: "DataStorage/renameProject",
        res: res,
        id: id,
      });
      return null;
    }

    const project = await res.json();
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

  userExport(project: Project) {
    const copy = project;
    copy.id = null;
    const json = JSON.stringify(copy);

    //const encrypted = CryptoJS.AES.encrypt(json, CRYPT_KEY).toString();

    const blob = new Blob([json], { type: "text/plain" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "project"}.art`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async userImport(): Promise<Project> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".art";

      input.style.display = "none";
      document.body.appendChild(input);

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          document.body.removeChild(input);
          return reject(new Error("No file selected"));
        }

        try {
          const text = await file.text();

          // const bytes = CryptoJS.AES.decrypt(text, CRYPT_KEY);
          // const decrypted = bytes.toString(CryptoJS.enc.Utf8);

          // if (!decrypted) {
          //   throw new Error("Invalid or corrupted file");
          // }

          const project: Project = JSON.parse(text);

          resolve(project);
        } catch (err) {
          reject(err);
        } finally {
          document.body.removeChild(input);
        }
      };

      // triggers file picker
      input.click();
    });
  }
}
