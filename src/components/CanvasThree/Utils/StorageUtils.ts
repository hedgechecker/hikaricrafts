import type { gridPosition, singlePattern } from "./InterfaceUtils";

export function save(pos:gridPosition, pattern: singlePattern) {
  var minimal = [pattern.rotation, pattern.patternIndex];
  pattern.materialMap.forEach((num) => {
    minimal.push(num);
  });
  localStorage.setItem("X" + pos.x + "Y" + pos.y + "Z" + pos.z, JSON.stringify(minimal));
}

export function remove(pos:gridPosition){
  localStorage.removeItem("X" + pos.x + "Y" + pos.y + "Z" + pos.z);
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

  if (value == null) {
    console.log("Pattern invalid or empty " + (typeof param === "string" ? param : `X${param.x}Y${param.y}Z${param.z}`));
    return;
  }

  const arr = JSON.parse(value);
  pattern.rotation = arr[0];
  pattern.patternIndex = arr[1];
  var map = [];
  for (var i = 2; i < arr.length; i++) {
    map.push(arr[i]);
  }
  pattern.materialMap = map;
  return pattern;
}
