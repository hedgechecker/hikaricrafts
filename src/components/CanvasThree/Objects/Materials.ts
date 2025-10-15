import * as THREE from "three";
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
 * @param index the Index of material
 * @returns THREE.Texture
 */
export function getWoodTexture(index: number) {
  var texture;
  switch (index) {
    case 0:
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
    case 1:
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

    case 2:
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
 * @param index the index of the Material
 * @returns THREE.MeshStandardMaterial
 */
export function getMaterial(index: number) {
  if (index == undefined) index = 0;
  if (index == 0) {
    return new THREE.MeshStandardMaterial({
      color: "#eae8d5",
      roughness: 1,
      metalness: 0.0,
    });
  }
  const map = getWoodTexture(index);
  return new THREE.MeshStandardMaterial({
    map: map,
    roughness: 1,
    metalness: 0.0,
  });
}

export function getFastMaterial(index: number) {}

/**
 * Returns the Material with 50% Opacity
 * @param index the index of the Material
 * @returns THREE.MeshStandardMaterial
 */
export function getOpaqueMaterial(index: number) {
  if (index == undefined) index = 0;
  const map = getWoodTexture(index);
  map.repeat.set(0.1, 0.1);
  return new THREE.MeshStandardMaterial({
    map: map,
    roughness: 0.8,
    metalness: 0.2,
    opacity: 0.5,
    transparent: true,
  });
}
