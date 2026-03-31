import { useEffect, useRef, useState } from "react";
import ImageUploader from "./ImageUploader";
import ToolButton from "../../global/ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";
import type { Settings } from "../models/Settings";
import type { ThreeEditor } from "../core/ThreeEditor";
import { useEditorStore } from "../core/EditorStore";
import type { ToolType } from "../tools/Tool";
import { showDialog } from "../../global/dialogController";

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
  const { settings, tool } = useEditorStore(engine.getStore());

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
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
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

  return (
    <div className={styles.toolbar} id="toolbar">
      {/* Navigation */}
      <ToolButton
        label="Zurück zum Anfang"
        image="/icons/back-arrow.svg"
        onClick={() => navigate("/")}
      />

      {/* Tool selection */}
      <div className={styles.toolSection} id="tools">
        <ToolButton
          label=""
          image="/icons/move.svg"
          toolTip="Elemente bewegen"
          active={tool === "move"}
          onClick={() => changeTool("move")}
        />

        <ToolButton
          label=""
          image="/icons/single-point.svg"
          toolTip="Einen Punkt zeichnen"
          active={tool === "point"}
          onClick={() => changeTool("point")}
        />

        <ToolButton
          label=""
          image="/icons/line.svg"
          toolTip="Eine Linie zeichnen"
          active={tool === "line"}
          onClick={() => changeTool("line")}
          id="linetool"
        />

        <ToolButton
          label=""
          image="/icons/eraser.svg"
          toolTip="Elemente löschen"
          active={tool === "delete"}
          onClick={() => changeTool("delete")}
        />

        <ToolButton
          label=""
          image="/icons/undo.svg"
          toolTip="Rückgängig machen"
          onClick={() => {
            engine.undo();
          }}
        />

        <ToolButton
          label=""
          image="/icons/redo.svg"
          toolTip="Wiederherstellen"
          onClick={() => engine.redo()}
        />
      </div>
      <div className={styles.toolSection}>
        {/* Save project */}
        <ToolButton
          label={saved ? "" : ""}
          image={saved ? "/icons/check.svg" : "/icons/save.svg"}
          toolTip="Projekt speichern"
          onClick={handleSave}
        />

        {/* Export project*/}
        <ToolButton
          label=""
          image="/icons/export.svg"
          toolTip="Projekt herunterladen"
          onClick={() => engine.exportProject()}
        />

        {/* Export project*/}
        <ToolButton
          label=""
          image="/icons/import.svg"
          toolTip="Projekt aus Datei importieren"
          onClick={() => engine.importProject()}
        />

        {/* Toggle settings panel */}
        <ToolButton
          id="settingsButton"
          label=""
          image="/icons/setting.svg"
          toolTip="Sichtbarkeiten ändern"
          onClick={() => setSettingsOpen(!settingsOpen)}
        />

        {/* Verify */}
        <ToolButton
          label="Überprüfen"
          image="/icons/preview.svg"
          toolTip="Vorschau erstellen"
          active={tool === "verify"}
          onClick={() => changeTool("verify")}
        />

        {/* Settings menu */}
        {settingsOpen && (
          <div ref={settingsRef} className={styles.settingsMenu}>
            <h4>Ansicht</h4>

            <label>
              <input
                type="checkbox"
                checked={settings?.showPoints}
                onChange={(e) => updateSetting("showPoints", e.target.checked)}
              />
              Punkte anzeigen
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings?.showImage}
                onChange={(e) => updateSetting("showImage", e.target.checked)}
              />
              Hintergrundbild anzeigen
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings?.showGrid}
                onChange={(e) => updateSetting("showGrid", e.target.checked)}
              />
              Gitter anzeigen
            </label>

            <label>
              Linienfarbe
              <input
                type="color"
                value={settings?.lineColor}
                onChange={(e) => updateSetting("lineColor", e.target.value)}
              />
            </label>

            <label>
              Punktfarbe
              <input
                type="color"
                value={settings?.pointColor}
                onChange={(e) => updateSetting("pointColor", e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Upload background reference image */}
        <ImageUploader
          onImageSelected={(img) => {
            engine.addBackgroundImage(img);
          }}
        />
      </div>
    </div>
  );
}
