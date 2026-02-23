// core/DataStorage.ts

import type { Project } from "../models/DataModel";

export class DataStorage {
  saveToLocal(projectName: string, data: Project) {
    localStorage.setItem(projectName, JSON.stringify(data));
  }

  loadFromLocal(projectName: string): Project | null {
    const raw = localStorage.getItem(projectName);
    if (!raw) return null;

    return JSON.parse(raw) as Project;
  }
}
