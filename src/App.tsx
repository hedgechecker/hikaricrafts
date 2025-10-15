import { useEffect, useState } from "react";
import "./App.css";

import SizePanel from "./components/SizePanel";
import PatternPanel from "./components/PatternPanel";
import SummaryPanel from "./components/SummaryPanel";
import Card from "./components/Card";
import Canvas from "./components/CanvasThree/CanvasThree";
import PatternEditorPanel from "./components/PatternEditor";

function App() {
  const [panelSize, setPanelSize] = useState({
    width: 490,
    height: 300,
    spacing: 30,
    depth: 18,
    frameWidth: 5,
    lineWidth: 2,
  });
  const [materialMap, setMaterialMap] = useState<number[]>([0,0,0]);
  const [patternIndex, setPatternIndex] = useState(1);
  // const [materialIndex, setMaterialIndex] = useState(0);

  useEffect(() =>{
    console.log("Global MaterialMap: "+materialMap)
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
          <Canvas panelSize={panelSize} patternIndex={patternIndex} materialMap={materialMap}/>
        </Card>
      </div>
    </div>
  );
}

export default App;
