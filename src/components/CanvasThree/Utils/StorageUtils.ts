import type {
  gridPosition,
  PanelConfig,
  singlePattern,
} from "./InterfaceUtils";
import { parseXYZ } from "./MathUtils";

export function save(pos: gridPosition, pattern: singlePattern) : void;
export function save(pos: gridPosition, arr: number[]) : void;
export function save(pos: gridPosition, param: singlePattern|number[]): void {
  if (Array.isArray(param)) {
    // Handle number[] case
    localStorage.setItem(
      `X${pos.x}Y${pos.y}Z${pos.z}`,
      JSON.stringify(param)
    );
  } else {
    // Handle singlePattern case
    const minimal = [param.rotation, param.patternIndex, ...param.materialMap];
    localStorage.setItem(
      `X${pos.x}Y${pos.y}Z${pos.z}`,
      JSON.stringify(minimal)
    );
  }
}

export function saveKeyValue(key: string, value: any){
  localStorage.setItem(key, JSON.stringify(value));
}
export function loadKeyValue(key: string): any{
  return JSON.parse(localStorage.getItem(key) as string);
}


export function saveDimensions(config: PanelConfig) {
  localStorage.setItem("Dim", JSON.stringify(config));
}

export function saveMaterials(index:number, map:number[]){
  localStorage.setItem("Material"+index,JSON.stringify(map));
}

export function loadMaterial(index:number){
  const mat = localStorage.getItem("Material"+index);
  if (!mat) return [];
  return JSON.parse(mat);
}

export function loadDimensions(): PanelConfig | null {
  const dim = localStorage.getItem("Dim");
  if (!dim) return null;
  return JSON.parse(dim);
}

export function remove(pos: gridPosition) : void;
export function remove(str: string) : void;
export function remove(param: gridPosition|string) {
  console.log( typeof param === "string");
  if(typeof param === "string"){
    localStorage.removeItem(param);
  }else{
    localStorage.removeItem("X" + param.x + "Y" + param.y + "Z" + param.z);
  }
}

export function load(pos: gridPosition): singlePattern | undefined;
export function load(key: string): singlePattern | undefined;
export function load(param: gridPosition | string): singlePattern | undefined {
  var pattern: singlePattern = {
    rotation: 0,
    patternIndex: 0,
    materialMap: [],
  };

  let value: string | null;
  if (typeof param === "string") {
    value = localStorage.getItem(param);
  } else {
    value = localStorage.getItem("X" + param.x + "Y" + param.y + "Z" + param.z);
  }

  if (!value) {
    console.log(
      "Pattern invalid or empty " +
        (typeof param === "string"
          ? param
          : `X${param.x}Y${param.y}Z${param.z}`)
    );
    return;
  }
  var arr;
  try {
    arr = JSON.parse(value);
  } catch (error) {
    console.log("Unidentified Key-Value in LocalStorage "+ param);
    return;
  }
  pattern.rotation = arr[0];
  pattern.patternIndex = arr[1];
  var map = [];
  for (var i = 2; i < arr.length; i++) {
    map.push(arr[i]);
  }
  pattern.materialMap = map;
  return pattern;
}

export function savePanel(){
  var type = "text/plain";
  //var content = JSON.stringify(loadDimensions());
  var content = "V1\n";
  for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i); // get the key name
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      content += JSON.stringify([key,value]) +"\n";
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "myPanel.kumiko";
  a.click();

  URL.revokeObjectURL(url);
}

export function loadPanel(){
  getFileFromUser().then(async (file) => {
  if (!file) return;
  const lines = await readFileLines(file);
  localStorage.clear();
  for(const line of lines){
    if(line == "V1"){
      console.log("V11");
      continue;
    }if(line.length <= 1){
      continue;
    }
    var parsed = JSON.parse(line);
    if(parsed.length == 2 && parsed[0][0] == 'X'){
      save(parseXYZ(parsed[0]) as gridPosition,JSON.parse(parsed[1])as number[]);
    }else if(parsed.length == 2 && parsed[0][0] == 'M'){
      const match = parsed[0].match(/Material\s*:?\s*(\d+)/);
    if (match) {
      saveMaterials(match[1], JSON.parse(parsed[1]));
    }

    }
  }
  console.log('Total lines:', lines.length);
  window.location.reload();
});
}
async function readFileLines(file: File): Promise<string[]> {
  const text = await file.text();
  // Normalize line endings and split
  const lines = text.split(/\r?\n/);
  return lines;
}

function getFileFromUser(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // or e.g. 'image/*', '.txt', '.json'

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      resolve(file);
    };

    // Trigger the file picker
    input.click();
  });
}