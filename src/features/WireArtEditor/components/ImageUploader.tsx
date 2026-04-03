import { useRef } from 'react';
import ToolButton from '../../global/ToolButton';
import imageCompression from "browser-image-compression";

interface Props {
  onImageSelected: (image: string) => void;
}

/**
 * Handles the hidden Upload of an User-Image
 * @param onImageSelected reaction to Image-Upload
 * @returns
 */
export default function ImageUploader({ onImageSelected }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Convert to base64 if needed
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(compressedFile); 
    } catch (error) {
      console.error("Compression failed:", error);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Visible ToolButton */}
      <ToolButton
        label="Bild laden"
        onClick={handleButtonClick}
        image="/icons/image.svg"
        toolTip="Ein neues Hintergrundbild öffnen"
        id='addImageButton'
      />
    </>
  );
}
