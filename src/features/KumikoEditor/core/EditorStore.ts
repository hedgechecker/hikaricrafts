import type { Settings } from "../models/Settings";
import type { Project } from "../models/Project";
import { useEffect, useState } from "react";
import type { ToolType } from "../tools/Tool";
import type { patternType, woodType } from "../models/Pattern";

type Listener = () => void;

interface EditorState {
  project: Project | null;
  settings: Settings | null;
  tool: ToolType;
  hasUndo: boolean;
  hasRedo: boolean;
  cameraMode: "3D" | "2D";
  selectedPattern: patternType;
  selectedWood: woodType;
  materialMap:  Array<{ woodType: woodType; thickness: number }>;
  userRotation: number;
}

export class EditorStore {
  private state: EditorState = {
    project: null,
    settings: null,
    tool: "move",
    hasUndo: false,
    hasRedo: false,
    cameraMode: "2D",
    selectedPattern: "Gomagara",
    selectedWood: "Fichte",
    materialMap: [],
    userRotation: 0,
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

  setHasUndo(has: boolean) {
    this.state.hasUndo = has;
    this.emit();
  }

  setHasRedo(has: boolean) {
    this.state.hasRedo = has;
    this.emit();
  }

  setCameraMode(mode: "2D" | "3D") {
    this.state.cameraMode = mode;
    this.emit();
  }

  setSelectedPattern(pattern: patternType) {
    this.state.selectedPattern = pattern;
    this.emit();
  }

  setSelectedWood(wood: woodType) {
    this.state.selectedWood = wood;
    this.emit();
  }

  setMaterialMap(map: Array<{ woodType: woodType; thickness: number }>) {
    this.state.materialMap = map;
    this.emit();
  }

  setUserRotation(rotation: number) {
    this.state.userRotation = rotation;
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
