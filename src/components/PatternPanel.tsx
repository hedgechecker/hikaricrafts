import { useState } from "react";
import Card from "./Card";
import styles from "./styles/PatternPanel.module.css";
import SVG from "./SVG";

interface PatternProps {
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function PatternPanel({ index, setIndex }: PatternProps) {
  const patterns = [
    { index: 0, name: "Empty" },
    { index: 1, name: "Asanoha" },
    { index: 2, name: "Gomagara" },
  ];
  const [selected, setSelected] = useState(index);

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
                setIndex(pattern.index);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelected(pattern.index);
                  setIndex(pattern.index);
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
