import { useEffect, useRef, useState } from "react";
import ToolButton from "../../global/ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";
import type { Settings } from "../models/Settings";
import type { ThreeEditor } from "../core/ThreeEditor";
import { useEditorStore } from "../core/EditorStore";
import type { ToolType } from "../tools/Tool";
import { showDialog } from "../../global/useDialog";
import { clamp } from "three/src/math/MathUtils.js";


interface Props {
  engine: ThreeEditor;
}
/**
 * Toolbar component
 *
 * Provides the main editor controls such as:
 * - tool selection (move, point, line)
 * - saving the project
 * - exporting as SVG
 * - view/settings configuration
 * - background image upload
 *
 * Communicates with the EditorEngine to update tools,
 * project state, and editor settings.
 */
export default function Toolbar({ engine }: Props) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const { settings, tool, hasRedo, hasUndo, cameraMode } = useEditorStore(
    engine.getStore(),
  );
  const { width, height, spacing, frameWidth } = engine
    .getStore()
    .getState().settings!;

  const [localSpacing, setLocalSpacing] = useState<number>(spacing);
  const [localHeight, setLocalHeight] = useState<number>(height);
  const [localWidth, setLocalWidth] = useState<number>(width);
  const [localFrameWidth, setLocalFrameWidth] = useState<number>(frameWidth);
  const [checked, setChecked] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Update a single editor setting.
   * Creates a new settings object and sends it to the engine.
   */
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const newSettings: Settings = { ...settings, [key]: value } as Settings;
    engine.setSettings(newSettings);
    engine.hasChanges = true;
  }

  const changeTool = (tool: ToolType) => {
    engine.setActiveTool(tool);
  };

  /**
   * Save the current project.
   *
   * If the user is not logged in, a warning dialog is shown.
   * A short visual confirmation is displayed after saving.
   */
  const handleSave = async () => {
    if (saved) return;
    const token = localStorage.getItem("token");
    if (!token) {
      await showDialog({
        type: "alert",
        message:
          "Sie sind nicht angemeldet, Änderungen werden nur lokal gespeichert ",
      });
    }
    engine.save();
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  /**
   * * Global keyboard shortcut:
   * Ctrl/Cmd + S triggers save.
   */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      const target = e.target as HTMLElement | null;

      // Check if the user is typing in an input, textarea, or contenteditable
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTyping) return;

      const toolMap: Record<string, ToolType> = {
        "1": "pattern",
        "2": "pattern",
        "3": "delete",
      };

      const tool = toolMap[key];
      if (tool) {
        e.preventDefault();
        engine.setActiveTool(tool);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const settingsbtn = document.getElementById("settingsButton");
      if (settingsbtn && settingsbtn.contains(e.target as Node)) return;
      if (settingsRef.current && settingsRef.current.contains(e.target as Node))
        return;

      setSettingsOpen(false);
    }

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleBack() {
    if (engine.hasChanges) {
      const result = await showDialog({
        type: "confirm",
        message:
          "Das Projekt hat ungespeicherte Änderungen, die womöglich nicht gespeichert werden, sicher zurück?",
      });
      if (!result) {
        return;
      }
    }
    navigate("/wireart");
  }

  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalSpacing(value); 
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSetting("spacing", value);
    }, 1000);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalWidth(Math.ceil(value));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const val = clamp(value, 100, 1000);
      updateSetting("width", val);
    }, 500);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalHeight(Math.ceil(value))
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSetting("height", Math.max(100, value));
    }, 500);
  };

  const handleFrameWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalFrameWidth(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSetting("frameWidth", value);
    }, 1000);
  };

  //Clamp the Grid to a full triangle size, if the option is checked  
  useEffect(() => {
    const minSize = 100;
    const maxSize = 5000;
    if (!checked) return;
    const triangleHeight = Math.sqrt(
      spacing * spacing - ((spacing / 2) * spacing) / 2,
    );

    const minwidth =
      Math.ceil((minSize - 2 * frameWidth) / (spacing / 2)) * (spacing / 2) +
      2 * frameWidth;
    const maxwidth =
      Math.ceil((maxSize - 2 * frameWidth) / (spacing / 2)) * (spacing / 2) +
      2 * frameWidth;
    const minheight =
      Math.ceil((minSize - 2 * frameWidth) / triangleHeight) * triangleHeight +
      2 * frameWidth;
    const maxheight =
      Math.ceil((maxSize - 2 * frameWidth) / triangleHeight) * triangleHeight +
      2 * frameWidth;
    var height = Math.max(
      Math.min(
        maxheight,
        Math.round((localHeight - 2 * frameWidth) / triangleHeight) *
          triangleHeight +
          2 * frameWidth,
      ),
      minheight,
    );
    height = Math.round(height * 10) / 10;
    const width = Math.max(
      Math.min(
        maxwidth,
        Math.round((localWidth - 2 * frameWidth) / (spacing / 2)) *
          (spacing / 2) +
          2 * frameWidth,
      ),
      minwidth,
    );

    setLocalWidth(width);
    setLocalHeight(height);

    //setPanelSize({ height: height, width: width });
    //saveDimensions(panelSize);
  }, [height, width, spacing, frameWidth, checked]);

  return (
    <div className={styles.toolbar} id="toolbar">
      {/* Navigation */}
      <ToolButton
        label="Zurück zur Übersicht"
        image="/icons/back-arrow.svg"
        onClick={() => handleBack()}
        id="backToOverview"
      />

      {/* Tool selection */}
      <div className={styles.toolSection} id="tools">
        {/* <ToolButton
          label=""
          image="/icons/move.svg"
          toolTip="Elemente bewegen"
          active={tool === "move"}
          onClick={() => changeTool("move")}
          id="movetool"
        /> */}

        <ToolButton
          label=""
          image="/icons/pattern.svg"
          toolTip="Ein Muster einfügen"
          active={tool === "pattern"}
          onClick={() => changeTool("pattern")}
          id="patterntool"
        />

        <ToolButton
          label=""
          image="/icons/eraser.svg"
          toolTip="Elemente löschen"
          active={tool === "delete"}
          onClick={() => changeTool("delete")}
          id="deletetool"
        />

        <ToolButton
          label=""
          image="/icons/undo.svg"
          toolTip="Rückgängig machen"
          inactive={!hasUndo}
          onClick={() => {
            engine.undo();
          }}
          id="undoButton"
        />

        <ToolButton
          label=""
          image="/icons/redo.svg"
          toolTip="Wiederherstellen"
          inactive={!hasRedo}
          onClick={() => {
            engine.redo();
          }}
          id="redoButton"
        />
      </div>
      <div className={styles.toolSection}>
        {/* Save project */}
        <ToolButton
          label={saved ? "" : ""}
          image={saved ? "/icons/check.svg" : "/icons/save.svg"}
          toolTip="Projekt speichern"
          active={saved}
          onClick={handleSave}
          id="saveButton"
        />

        {/* Export project*/}
        <ToolButton
          label=""
          image="/icons/export.svg"
          toolTip="Projekt herunterladen"
          onClick={() => engine.exportProject()}
          id="exportButton"
        />

        {/* Export project*/}
        <ToolButton
          label=""
          image="/icons/import.svg"
          toolTip="Projekt aus Datei importieren"
          onClick={() => engine.importProject()}
          id="importButton"
        />

        {/* Toggle settings panel */}
        <ToolButton
          id="settingsButton"
          label=""
          image="/icons/setting.svg"
          toolTip="Sichtbarkeiten ändern"
          active={settingsOpen}
          onClick={() => setSettingsOpen(!settingsOpen)}
        />

        {/* Toggle 3D/2D */}
        <ToolButton
          id="dimensionButton"
          label=""
          image={cameraMode == "3D" ? "/icons/3D.svg" : "/icons/2D.svg"}
          toolTip="Kamera Modus umschalten"
          onClick={() => engine.setCameraMode(cameraMode == "3D" ? "2D" : "3D")}
        />

        {/* Settings menu */}
        {settingsOpen && (
          <div ref={settingsRef} className={styles.settingsMenu}>
            <div className={styles.container}>
              <div className={styles.item}>
                <label>
                  Breite (mm)
                  <input
                    name="PanelWidthInput"
                    className={styles.input}
                    type="number"
                    value={localWidth}
                    onChange={handleWidthChange}
                  />{" "}
                </label>
              </div>
              <div className={styles.item}>
                <label>
                  Höhe (mm)
                  <input
                    name="PanelHeightInput"
                    className={styles.input}
                    type="number"
                    value={localHeight}
                    onChange={handleHeightChange}
                  />
                </label>
              </div>
            </div>
            <div>
              <div className={styles.label}>
                <span>Größe ans Gitter anpassen</span>
                <input
                  name="SnapToGrid?"
                  type="checkbox"
                  style={{ accentColor: "#e2e8f0" }}
                  checked={checked}
                  onChange={(e) => {
                    setChecked(e.target.checked);
                  }}
                ></input>
              </div>
            </div>

            <div>
              <div className={styles.label}>
                <span>Zellgröße (mm)</span>
                <span>{localSpacing}</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={1}
                value={localSpacing}
                onChange={handleSpacingChange}
                className={styles.slider}
              />
            </div>

            <div>
              <div className={styles.label}>
                <span>Rahmen-Breite (mm)</span>
                <span>{localFrameWidth}</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={localFrameWidth}
                onChange={handleFrameWidthChange}
                className={styles.slider}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
