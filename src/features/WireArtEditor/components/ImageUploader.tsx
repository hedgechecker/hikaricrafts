import { useRef } from "react";
import ToolButton from "../../global/ToolButton";
import imageCompression from "browser-image-compression";
import { logError, logWarn } from "../../../utils/error/errorHandler";

interface Props {
  onImageSelected: (image: string) => void;
}

/**
 * Handles the hidden Upload of an User-Image
 * @param onImageSelected reaction to Image-Upload
 */
export default function ImageUploader({ onImageSelected }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      logWarn("Couldnt Find the User-Selected Image", {
        function: "ImageUploader/handleFileChange",
        file: e.target.files,
      });
      return;
    }

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
      logError("Compression failed", {
        function: "ImageUploader/handleFileChange",
        error: error,
      });
    }
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
      <ToolButton
        label=""
        onClick={handleButtonClick}
        image="/icons/image.svg"
        toolTip="Ein neues Hintergrundbild öffnen"
        id="addImageButton"
      />
    </>
  );
}
