import type { patternType } from "../models/Pattern";
import type { Settings } from "../models/Settings";
import { getPatternPoints } from "../utils/patternCreation";

interface SVGProps {
  type: patternType;
}

function SVG({type}:SVGProps) {
  // Convert points to "x,y x,y ..." string format
  const points = getPatternPoints(type, {
    spacing: 10,
    lineWidth: 0.9,
  } as Settings);
  const outline = [{x:4.3300,y:36.9338},{x:45.6699,y:36.9338},{x:25,y:1.1324},];


  return (
    <svg width={50} height={50} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points={outline.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="white"
        stroke="black"
        strokeWidth={2}
      />
      <polyline
        points={points.map((p) => `${p.x * 5 + 25},${(-p.y*5) +25}`).join(" ")}
        fill="white"
        stroke="black"
        strokeWidth={1}
      />
      <g transform="rotate(120, 25, 25)">
      <polyline
        points={points.map((p) => `${p.x * 5 + 25},${-p.y * 5 + 25}`).join(" ")}
        fill="white"
        stroke="black"
        strokeWidth={1}
      />
    </g>
    <g transform="rotate(240, 25, 25)">
      <polyline
        points={points.map((p) => `${p.x * 5 + 25},${-p.y * 5 + 25}`).join(" ")}
        fill="white"
        stroke="black"
        strokeWidth={1}
      />
    </g>
    </svg>
  );
}

export default SVG;
