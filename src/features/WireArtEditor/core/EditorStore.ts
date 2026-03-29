import type { Settings } from '../models/Settings';
import type { Project } from '../models/Project';

type Listener = () => void;

interface EditorState {
  project: Project | null;
  settings: Settings | null;
  tool: ToolType;
}

export class EditorStore {
  private state: EditorState = {
    project: null,
    settings: null,
    tool: "line",
  };

  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return this.state;
  }

  setProject(project: Project) {
    this.state.project = project;
    this.state.settings = project.settings;
    this.emit();
  }

  setTool(tool: ToolType) {
    this.state.tool = tool;
    this.emit();
  }

  updateSettings(settings: Settings) {
    this.state.settings = settings;
    this.emit();
  }
}

import { useEffect, useState } from 'react';
import type { ToolType } from '../tools/Tool';

export function useEditorStore(store: EditorStore) {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });

    return unsubscribe;
  }, [store]);

  return state;
}
