import ImageUploader from "./ImageUploader";
import ToolButton from "./ToolButton";
import styles from "./styles/Toolbar.module.css";
import { useNavigate } from "react-router-dom";



interface Props {
  onImageSelected: (image: string) => void;
}

export default function Toolbar({ onImageSelected }: Props) {
  const navigate = useNavigate();

  return (
    <div className={styles.toolbar}>
        <ToolButton label="Zurück zum Anfang" image="/icons/back-arrow.png" onClick={() => navigate("/")}/>
      <div className={styles.toolSection}>
        <ToolButton label="Bewegen" image="/icons/move.png" toolTip="Ansicht bewegen" active/>
        <ToolButton label="Punkt" image="/icons/single-point.png" toolTip="Einen Punkt zeichnen"/>
        <ToolButton label="Linie" image="/icons/line.png" toolTip="Eine Linie zeichnen"/>
      </div>
      <ImageUploader onImageSelected={onImageSelected} />

    </div>
  );
}