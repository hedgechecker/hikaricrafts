import { useEffect, useRef, useState } from 'react';
import ImageUploader from './ImageUploader';
import ToolButton from '../../global/ToolButton';
import styles from './styles/Toolbar.module.css';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../../global/useDialog';
import type { Settings } from '../models/Settings';
import type { ThreeEditor } from '../core/ThreeEditor';
import { useEditorStore } from '../core/EditorStore';
import type { ToolType } from '../tools/Tool';

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

  const [active, setActive] = useState<ToolType>('move');
  const [saved, setSaved] = useState(false);
  const { showDialog, dialogComponent } = useDialog();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useEditorStore(engine.getStore());

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
    setActive(tool);
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
    const token = localStorage.getItem('token');
    if (!token) {
      await showDialog({
        type: 'alert',
        message: 'Sie sind nicht angemeldet, Änderungen werden nur lokal gespeichert ',
      });
    }
    console.log('save');
    engine.save();
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleExport = () => {
    engine.exportSVG();
  };

  /**
   * * Global keyboard shortcut:
   * Ctrl/Cmd + S triggers save.
   */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);



  return (
    <div className={styles.toolbar}>
      {dialogComponent}

      {/* Navigation */}
      <ToolButton
        label="Zurück zum Anfang"
        image="/icons/back-arrow.png"
        onClick={() => navigate('/')}
      />

      {/* Tool selection */}
      <div className={styles.toolSection}>
        <ToolButton
          label=""
          image="/icons/move.png"
          toolTip="Elemente bewegen"
          active={active === 'move'}
          onClick={() => changeTool('move')}
        />

        <ToolButton
          label=""
          image="/icons/single-point.png"
          toolTip="Einen Punkt zeichnen"
          active={active === 'point'}
          onClick={() => changeTool('point')}
        />

        <ToolButton
          label=""
          image="/icons/line.png"
          toolTip="Eine Linie zeichnen"
          active={active === 'line'}
          onClick={() => changeTool('line')}
        />

        {/* Save project */}
        <ToolButton
          label={saved ? '' : ''}
          image={saved ? '/icons/check.png' : '/icons/save.png'}
          toolTip="Projekt speichern"
          onClick={handleSave}
        />

        {/* Export project */}
        <ToolButton
          label=""
          image="/icons/export.png"
          toolTip="Projekt als SVG Datei exportieren"
          onClick={handleExport}
        />

        {/* Toggle settings panel */}
        <ToolButton
          label=""
          image="/icons/setting.png"
          toolTip="Sichtbarkeiten ändern"
          onClick={() => setSettingsOpen(!settingsOpen)}
        />

        {/* Verify */}
        <ToolButton
          label="Überprüfen"
          image="/icons/check.png"
          toolTip="Inhalt checken"
          onClick={() => changeTool('verify')}
        />

        {/* Settings menu */}
        {settingsOpen && (
          <div ref={settingsRef} className={styles.settingsMenu}>
            <h4>Ansicht</h4>

            <label>
              <input
                type="checkbox"
                checked={settings?.showPoints}
                onChange={(e) => updateSetting('showPoints', e.target.checked)}
              />
              Punkte anzeigen
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings?.showImage}
                onChange={(e) => updateSetting('showImage', e.target.checked)}
              />
              Hintergrundbild anzeigen
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings?.showGrid}
                onChange={(e) => updateSetting('showGrid', e.target.checked)}
              />
              Gitter anzeigen
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings?.snapToGrid}
                onChange={(e) => updateSetting('snapToGrid', e.target.checked)}
              />
              Punkte am Gitter ausrichten
            </label>

            <label>
              Linienfarbe
              <input
                type="color"
                value={settings?.lineColor}
                onChange={(e) => updateSetting('lineColor', e.target.value)}
              />
            </label>

            <label>
              Punktfarbe
              <input
                type="color"
                value={settings?.pointColor}
                onChange={(e) => updateSetting('pointColor', e.target.value)}
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
