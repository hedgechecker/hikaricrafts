import type { Settings } from "../models/Settings";
import type { Project } from "../models/Project";
import { useEffect, useState } from "react";
import type { ToolType } from "../tools/Tool";

type Listener = () => void;

interface EditorState {
  project: Project | null;
  settings: Settings | null;
  tool: ToolType;
  hasUndo: boolean;
  hasRedo: boolean;
}

export class EditorStore {
  private state: EditorState = {
    project: null,
    settings: null,
    tool: "line",
    hasUndo: false,
    hasRedo: false,
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
    this.state.hasRedo = false;
    this.state.hasUndo = false;
    this.emit();
  }

  setTool(tool: ToolType) {
    this.state.tool = tool;
    this.emit();
  }

  setHasUndo(has: boolean) {
    this.state.hasUndo = has;
    this.emit();
  }

  setHasRedo(has: boolean) {
    this.state.hasRedo = has;
    this.emit();
  }

  updateSettings(settings: Settings) {
    this.state.settings = settings;
    this.emit();
  }
}

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
