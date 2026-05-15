import * as THREE from "three";
import type { WoodType } from "../models/Pattern";
const loader = new THREE.TextureLoader();
let oakPic: HTMLImageElement | null = null;
let sprucePic: HTMLImageElement | null = null;
let douglasfir: HTMLImageElement | null = null;

//for debugging
export const blackmaterial = new THREE.MeshBasicMaterial({
  color: "black",
  opacity: 0.5,
  transparent: true,
});

/**
 * @param type the Index of material
 * @returns THREE.Texture
 */
export function getWoodTexture(type: WoodType) {
  var texture;
  switch (type) {
    case "Pine":
      if (sprucePic) {
        const texture = new THREE.Texture(sprucePic);
        texture.needsUpdate = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
      }

      texture = loader.load("/src/assets/fichte.jpg", (loadedTex) => {
        sprucePic = loadedTex.image;
      });
      break;
    case "Oak":
      if (oakPic) {
        const texture = new THREE.Texture(oakPic);
        texture.needsUpdate = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
      }

      texture = loader.load("/src/assets/eiche.jpg", (loadedTex) => {
        oakPic = loadedTex.image;
      });
      break;

    case "DouglasFir":
      if (douglasfir) {
        const texture = new THREE.Texture(douglasfir);
        texture.needsUpdate = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
      }

      texture = loader.load("/src/assets/douglasie.jpg", (loadedTex) => {
        douglasfir = loadedTex.image;
      });
      break;
    default:
      texture = loader.load("/src/assets/wood_texture.jpg", (loadedTex) => {
        sprucePic = loadedTex.image;
      });
      break;
  }

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.1, 0.1);
  return texture;
}

/**
 *
 * @param type the type of the Material
 * @returns THREE.MeshStandardMaterial
 */
export function getMaterial(type: WoodType) {
  if (type == undefined) type = "Pine";
  const map = getWoodTexture(type);
  return new THREE.MeshStandardMaterial({
    map: map,
    roughness: 1,
    metalness: 0.0,
  });
}

export function getFastMaterial(type: WoodType, opaque = false) {
  const material = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0.0,
    opacity: opaque ? 0.5 : 1.0,
    transparent: opaque,
  });
  switch (type) {
    case "Pine":
      material.color = new THREE.Color("#eae8d5");
      break;
    case "Oak":
      material.color = new THREE.Color("#85390a");
      break;
    case "DouglasFir":
      material.color = new THREE.Color("#e36110");
      break;
    default:
      material.color = new THREE.Color("#eae8d5");
      break;
  }
  return material;
}

/**
 * Returns the Material with 50% Opacity
 * @param type the type of the Material
 * @returns THREE.MeshStandardMaterial
 */
export function getOpaqueMaterial(type: WoodType) {
  if (type == undefined) type = "Pine";
  const map = getWoodTexture(type);
  map.repeat.set(0.1, 0.1);
  return new THREE.MeshStandardMaterial({
    map: map,
    roughness: 0.8,
    metalness: 0.2,
    opacity: 0.5,
    transparent: true,
  });
}
