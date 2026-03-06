import { useState } from "react";
import type { ToolType } from "../three/ThreeEditor";
import ImageUploader from "./ImageUploader";
import ToolButton from "./ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";



interface Props {
  onImageSelected: (image: string) => void;
  onSelectTool: (tool: ToolType) => void;
  onSave: () => void;
  onExport: () => void;
}

export default function Toolbar({ onImageSelected, onSelectTool, onSave, onExport }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState<ToolType>("move");
  const [saved, setSaved] = useState(false);

  const handleClick = (tool: ToolType) => {
    setActive(tool);
    onSelectTool(tool);
  };

  const handleSave = () => {
    if(saved)return;
    onSave();
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleExport = () => {
    onExport();
  };

  return (
    <div className={styles.toolbar}>
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
          image='/icons/export.png'
          toolTip="Projekt als SVG Datei exportieren"
          onClick={handleExport}
        />
      </div>
      <ImageUploader onImageSelected={onImageSelected} />
    </div>
  );
}