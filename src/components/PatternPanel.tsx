import { useEffect, useState } from "react";
import Card from "./Card";
import styles from "./styles/PatternPanel.module.css";
import SVG from "./SVG";
import { useAppStore } from "../store/useAppStore";

export default function PatternPanel() {
    const {setPatternIndex, patternIndex } = useAppStore();
  const patterns = [
    { index: 0, name: "Empty" },
    { index: 1, name: "Asanoha" },
    { index: 2, name: "Gomagara" },
  ];
  const [selected, setSelected] = useState(patternIndex);
  useEffect(() => {
    setSelected(patternIndex);
  },[patternIndex])

  return (
    <Card title="Pattern Library" padding foldable>
      <div className={styles.grid}>
        {patterns.map((pattern) => (
          <Card key={pattern.name} selected={pattern.index == selected} foldable={false}>
            <div
              tabIndex={0}
              role="button"
              className={styles.container}
              onClick={() => {
                setSelected(pattern.index);
                setPatternIndex(pattern.index);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelected(pattern.index);
                  setPatternIndex(pattern.index);
                }
              }}
            >
              <SVG index={pattern.index}></SVG>
              <div className={styles.label}>{pattern.name}</div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
