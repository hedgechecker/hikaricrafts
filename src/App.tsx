import { useAppStore } from "./store/useAppStore";
import SizePanel from "./components/SizePanel";
import PatternPanel from "./components/PatternPanel";
import SummaryPanel from "./components/SummaryPanel";
import Card from "./components/Card";
import Canvas from "./components/CanvasThree/CanvasThree";
import PatternEditorPanel from "./components/PatternEditor";
import "./App.css";

function App() {
  const {
    patternIndex,
  } = useAppStore();


  return (
    <div className="main">
      <div className="leftBar">
        <div className="scrollbar">
          <div className="leftBarLtr">
            <SizePanel />
            <PatternPanel />
            <PatternEditorPanel />
            <SummaryPanel />
          </div>
        </div>
      </div>

      <div className={patternIndex == 0 ? "Canvas cursor-eraser " : "Canvas"}>
        <Card title="Design Canvas" padding>
          <Canvas />
        </Card>
      </div>
    </div>
  );
}

export default App;
