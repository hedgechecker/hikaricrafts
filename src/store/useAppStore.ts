import { create } from "zustand";
import { loadDimensions,loadMaterial } from "../components/CanvasThree/Utils/StorageUtils";
import type { PanelConfig } from "../components/CanvasThree/Utils/InterfaceUtils";
import type { patternType } from "../features/KumikoEditor/models/Pattern";


interface AppState {
  panelSize: PanelConfig;
  setPanelSize: (newSize: Partial<PanelConfig>) => void;

  materialMap: number[];
  setMaterialMap: (newMap: number[]) => void;

  patternIndex: patternType;
  setPatternIndex: (index: patternType) => void;

  mousePos: { x: number; y: number, z:number };
  setMousePos: (pos: { x: number; y: number, z: number }) => void;
}

// Initialize defaults using your helper functions
const config = loadDimensions();
const defaultPanelConfig: PanelConfig = {
  width: config ? config.width : 490,
  height: config ? config.height : 300,
  spacing: config ? config.spacing : 30,
  depth: config ? config.depth : 18,
  frameWidth: config ? config.frameWidth : 5,
  lineWidth: config ? config.lineWidth : 2,
};

export const useAppStore = create<AppState>((set) => ({
  panelSize: defaultPanelConfig,
  setPanelSize: (newSize) =>
    set((state) => ({
      panelSize: { ...state.panelSize, ...newSize },
    })),

  materialMap: loadMaterial(1),
  setMaterialMap: (newMap:number[])  => set({materialMap:newMap}),

  patternIndex: "Mystery",
  setPatternIndex: (index:patternType) => set({ patternIndex: index }),

  mousePos: { x: 0, y: 0, z:0},
  setMousePos: (pos) => set({ mousePos: pos }),
}));
