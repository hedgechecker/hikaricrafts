import { useEffect, useState } from 'react';
import type { ToolType } from '../three/ThreeEditor';
import ImageUploader from './ImageUploader';
import ToolButton from './ToolButton';
import styles from './styles/Toolbar.module.css';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../../global/useDialog';
import type { Settings } from '../models/Settings';
import type { EditorEngine } from '../core/EditorEngine';
import { useEditorStore } from '../core/EditorStore';

interface Props {
  engine: EditorEngine;
}

export default function Toolbar({ engine }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState<ToolType>('move');
  const [saved, setSaved] = useState(false);
  const { showDialog, dialogComponent } = useDialog();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useEditorStore(engine.getStore());

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const newSettings: Settings = { ...settings, [key]: value } as Settings;
    engine.updateSettings(newSettings);
  }

  const handleClick = (tool: ToolType) => {
    setActive(tool);
    engine.setActiveTool(tool);
  };

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        handleSave();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className={styles.toolbar}>
      {dialogComponent}
      <ToolButton
        label="Zurück zum Anfang"
        image="/icons/back-arrow.png"
        onClick={() => navigate('/')}
      />
      <div className={styles.toolSection}>
        <ToolButton
          label="Bewegen"
          image="/icons/move.png"
          toolTip="Elemente bewegen"
          active={active === 'move'}
          onClick={() => handleClick('move')}
        />

        <ToolButton
          label="Punkt"
          image="/icons/single-point.png"
          toolTip="Einen Punkt zeichnen"
          active={active === 'point'}
          onClick={() => handleClick('point')}
        />

        <ToolButton
          label="Linie"
          image="/icons/line.png"
          toolTip="Eine Linie zeichnen"
          active={active === 'line'}
          onClick={() => handleClick('line')}
        />
        <ToolButton
          label={saved ? 'Gespeichert' : 'Speichern'}
          image={saved ? '/icons/check.png' : '/icons/save.png'}
          toolTip="Projekt speichern"
          onClick={handleSave}
        />
        <ToolButton
          label="SVG exportieren"
          image="/icons/export.png"
          toolTip="Projekt als SVG Datei exportieren"
          onClick={handleExport}
        />
        <ToolButton
          label="Ansicht"
          image="/icons/setting.png"
          toolTip="Sichtbarkeiten ändern"
          onClick={() => setSettingsOpen(!settingsOpen)}
        />
        {settingsOpen && (
          <div className={styles.settingsMenu}>
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
      </div>
      <ImageUploader
        onImageSelected={(img) => {
          engine.setBackgroundImage(img);
        }}
      />
    </div>
  );
}
