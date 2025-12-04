import { useEffect, useRef, useState } from "react";
import Card from "./Card";
import styles from "./styles/SizePanel.module.css";
import { saveDimensions } from "./CanvasThree/Utils/StorageUtils";
import { clamp } from "three/src/math/MathUtils.js";
import { useAppStore } from "../store/useAppStore";


export default function SizePanel() {
  const {setPanelSize, panelSize } = useAppStore();
  const { width, height, spacing, frameWidth } = panelSize;

  const [localSpacing, setLocalSpacing] = useState<number>(spacing);
  const [localHeight, setLocalHeight] = useState<number>(height);
  const [localWidth, setLocalWidth] = useState<number>(width);
  const [localFrameWidth, setLocalFrameWidth] = useState<number>(frameWidth);
  const [checked, setChecked] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  //Add to all inputs a debounce, so the User can input without getting interrupted
  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalSpacing(value); // update slider immediately

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPanelSize({spacing: value});
    }, 1000);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalWidth(Math.ceil(value));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const val = clamp(value, 100, 1000);
      setPanelSize({width: val});
    }, 500);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalHeight(Math.ceil(value)); // update slider immediately

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPanelSize({height: Math.max(100, value)});
    }, 500);
  };

  const handleFrameWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalFrameWidth(value); // update slider immediately

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPanelSize({frameWidth: value});
    }, 1000);
  };

  useEffect(() => {
    const minSize = 100;
    const maxSize = 5000;
    if (!checked) return;
    const triangleHeight = Math.sqrt(
      spacing * spacing - ((spacing / 2) * spacing) / 2
    );

    const minwidth =
      Math.ceil((minSize - 2 * frameWidth) / (spacing / 2)) * (spacing / 2) +
      2 * frameWidth;
    const maxwidth =
      Math.ceil((maxSize - 2 * frameWidth) / (spacing / 2)) * (spacing / 2) +
      2 * frameWidth;
    const minheight =
      Math.ceil((minSize - 2 * frameWidth) / triangleHeight) * triangleHeight +
      2 * frameWidth;
    const maxheight =
      Math.ceil((maxSize - 2 * frameWidth) / triangleHeight) * triangleHeight +
      2 * frameWidth;
    var height = Math.max(
      Math.min(maxheight,
      Math.round((localHeight - 2 * frameWidth) / triangleHeight) *
        triangleHeight + 2 * frameWidth),
      minheight
    );
    height = Math.round(height * 10) / 10;
    const width = Math.max(
      Math.min(maxwidth, 
      Math.round((localWidth - 2 * frameWidth) / (spacing / 2)) *
        (spacing / 2) + 2 * frameWidth),
      minwidth
    );

    setLocalWidth(width);
    setLocalHeight(height);

    setPanelSize({height: height,width: width});
    saveDimensions(panelSize);
  }, [height, width, spacing, frameWidth, checked]);

  return (
    <Card title="Panel Size" padding foldable>
      <div className={styles.container}>
        <div className={styles.item}>
          <label>
            Width (mm)
            <input
              name="PanelWidthInput"
              className={styles.input}
              type="number"
              value={localWidth}
              onChange={handleWidthChange}
            />{" "}
          </label>
        </div>
        <div className={styles.item}>
          <label>
            Height (mm)
            <input
              name="PanelHeightInput"
              className={styles.input}
              type="number"
              value={localHeight}
              onChange={handleHeightChange}
            />
          </label>
        </div>
      </div>

      <div>
        <div className={styles.label}>
          <span>Cell size (mm)</span>
          <span>{localSpacing}</span>
        </div>
        <input
          type="range"
          min={20}
          max={60}
          step={10}
          value={localSpacing}
          onChange={handleSpacingChange}
          className={styles.slider}
        />
      </div>

      <div>
        <div className={styles.label}>
          <span>Frame Width (mm)</span>
          <span>{localFrameWidth}</span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={5}
          value={localFrameWidth}
          onChange={handleFrameWidthChange}
          className={styles.slider}
        />
      </div>

      <div>
        <div className={styles.label}>
          <span>Snap Size to Grid</span>
          <input
            name="SnapToGrid?"
            type="checkbox"
            style={{ accentColor: "#e2e8f0" }}
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
            }}
          ></input>
        </div>
      </div>
    </Card>
  );
}
