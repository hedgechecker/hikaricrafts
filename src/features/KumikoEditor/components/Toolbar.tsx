import { useEffect, useRef, useState } from "react";
import ToolButton from "../../global/ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";
import type { Settings } from "../models/Settings";
import type { ThreeEditor } from "../core/ThreeEditor";
import { useEditorStore } from "../core/EditorStore";
import type { ToolType } from "../tools/Tool";
import { showDialog } from "../../global/useDialog";

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
          image= {cameraMode == "3D" ? "/icons/3D.svg" : "/icons/2D.svg"} 
          toolTip="Kamera Modus umschalten"
          onClick={() => engine.setCameraMode(cameraMode == "3D" ? "2D" : "3D")}
        />

        {/* Settings menu */}
        {settingsOpen && (
          <div ref={settingsRef} className={styles.settingsMenu}>
            <h4>Ansicht</h4>

            <label>
              <input
                type="number"
                value={settings?.width}
                onChange={(e) => updateSetting("width", e.target.valueAsNumber)}
                className={styles.checkbox}
              />
              Panel-Breite
            </label>

            <label>
              <input
                type="number"
                value={settings?.height}
                onChange={(e) =>
                  updateSetting("height", e.target.valueAsNumber)
                }
                className={styles.checkbox}
              />
              Panel-Höhe
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
