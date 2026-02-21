import { useState } from "react";
import type { ToolType } from "../three/ThreeEditor";
import ImageUploader from "./ImageUploader";
import ToolButton from "./ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";



interface Props {
  onImageSelected: (image: string) => void;
  onSelectTool: (tool: ToolType) => void;
}

export default function Toolbar({ onImageSelected, onSelectTool }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState<ToolType>("move");

  const handleClick = (tool: ToolType) => {
    setActive(tool);
    onSelectTool(tool);
  };

  return (
    <div className={styles.toolbar}>
        <ToolButton label="Zurück zum Anfang" image="/icons/back-arrow.png" onClick={() => navigate("/")}/>
      <div className={styles.toolSection}>

        <ToolButton label="Bewegen" 
          image="/icons/move.png" 
          toolTip="Ansicht bewegen" 
          active={active === "move"}
          onClick={() => handleClick("move")}/>

        <ToolButton label="Punkt" 
          image="/icons/single-point.png" 
          toolTip="Einen Punkt zeichnen" 
          active={active === "point"}
          onClick={() => handleClick("point")}/>

        <ToolButton label="Linie" 
          image="/icons/line.png" 
          toolTip="Eine Linie zeichnen" 
          active={active === "line"}
          onClick={() => handleClick("line")}/>
      </div>
      <ImageUploader onImageSelected={onImageSelected} />

    </div>
  );
}