import { useEffect, useState } from "react";
import "./App.css";

import SizePanel from "./components/SizePanel";
import PatternPanel from "./components/PatternPanel";
import SummaryPanel from "./components/SummaryPanel";
import Card from "./components/Card";
import Canvas from "./components/CanvasThree/CanvasThree";
import PatternEditorPanel from "./components/PatternEditor";
import { loadDimensions } from "./components/CanvasThree/Utils/StorageUtils";

function App() {
  const config = loadDimensions();
  const [panelSize, setPanelSize] = useState({
    width: config ? config.width : 490,
    height: config ? config.height : 300,
    spacing: config ? config.spacing : 30,
    depth: config ? config.depth : 18,
    frameWidth: config ? config.frameWidth : 5,
    lineWidth: config ? config.lineWidth : 2,
  });
  const [materialMap, setMaterialMap] = useState<number[]>([0, 0, 0]);
  const [patternIndex, setPatternIndex] = useState(1);
  // const [materialIndex, setMaterialIndex] = useState(0);

  useEffect(() => {
    console.log("Global MaterialMap: " + materialMap);
  }, [materialMap]);

  return (
    <div className="main">
      <div className="leftBar">
        <div className="scrollbar">
          <div className="leftBarLtr">
            <SizePanel panelSize={panelSize} setPanelSize={setPanelSize} />
            <PatternPanel index={patternIndex} setIndex={setPatternIndex} />
            <PatternEditorPanel
              index={patternIndex}
              panelSize={panelSize}
              setMaterialMap={setMaterialMap}
              materialMap={materialMap}
            />
            <SummaryPanel />
          </div>
        </div>
      </div>
      <div className={patternIndex == 0 ? "Canvas cursor-eraser " : "Canvas"}>
        <Card title="Design Canvas" padding>
          <Canvas
            panelSize={panelSize}
            patternIndex={patternIndex}
            materialMap={materialMap}
          />
        </Card>
      </div>
    </div>
  );
}

export default App;
