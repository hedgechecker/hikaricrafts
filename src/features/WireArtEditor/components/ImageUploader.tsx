import { useRef } from "react";
import ToolButton from "./ToolButton";

interface Props {
  onImageSelected: (image: string) => void;
}

/**
 * Handles the Upload of an User-Image
 * @param onImageSelected reaction to Image-Upload
 * @returns 
 */
export default function ImageUploader({ onImageSelected }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Visible ToolButton */}
      <ToolButton label="Bild laden" onClick={handleButtonClick} image="/icons/image.png" toolTip="Ein neues Hintergrundbild öffnen" />
    </>
  );
}
