import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import type { PanelConfig } from "./InterfaceUtils";

/**
 *
 * @param camera the camera object to add the controls
 * @param renderer the rendered scene
 * @param sphere center of the scene
 */
export function addControls(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  sphere: THREE.Sphere,
  config: PanelConfig
) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableZoom = true;
  controls.target.copy(sphere.center);
  controls.zoomSpeed = 5;

  controls.minDistance = sphere.radius * 0.05;
  controls.maxDistance = sphere.radius * 1.5;

  const minDistance = sphere.radius * 0.05;
  const maxDistance = sphere.radius * 1.5;
  const minZoom = 0.05; // smaller number = zoomed out
  const maxZoom = 0.5; // larger number = zoomed in

  //bounding box for X/Y/Z movement
  const minPan = new THREE.Vector3(-config.width / 2, -config.height / 2, -10);
  const maxPan = new THREE.Vector3(config.width / 2, config.height / 2, 10);

  const _v = new THREE.Vector3();
  if (camera instanceof THREE.OrthographicCamera){
    camera.zoom = 0.1;
      camera.updateProjectionMatrix();
    camera.updateMatrix();
  }

  controls.addEventListener("change", () => {
    // --- PAN CLAMP ---
    _v.copy(controls.target);
    controls.target.clamp(minPan, maxPan);
    camera.position.add(controls.target.clone().sub(_v)); // keep relative offset

    // --- ZOOM CLAMP ---
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom, minZoom, maxZoom);
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.PerspectiveCamera) {
      const distance = camera.position.distanceTo(controls.target);
      if (distance < minDistance) {
        camera.position.addScaledVector(
          camera.getWorldDirection(new THREE.Vector3()),
          minDistance - distance
        );
      } else if (distance > maxDistance) {
        camera.position.addScaledVector(
          camera.getWorldDirection(new THREE.Vector3()),
          maxDistance - distance
        );
      }
    }
  });

  controls.update();
  return controls;
}

/**
 * adds a camera in the center of the given scene
 * @param mount the html element
 * @param sphere the center of the scene
 * @returns a camera object
 */
export function createCamera(mount: HTMLDivElement) {
  const camera = new THREE.PerspectiveCamera(
    60,
    mount.clientWidth / mount.clientHeight,
    0.1,
    5000
  );
  return camera;
}

/**
 * adds front and back lighting and ambient light
 * @param scene the scene to add lighting
 * @param sphere the center of the scene
 */
export function addLighting(scene: THREE.Scene, sphere: THREE.Sphere) {
  //shines light from the front
  const light = new THREE.DirectionalLight(0xfdf3c6, 1);
  light.position.set(
    sphere.center.x,
    sphere.center.y,
    sphere.center.z + sphere.radius
  );
  light.target.position.copy(sphere.center);
  scene.add(light);

  //shines light from the back
  const light2 = new THREE.DirectionalLight(0xfdf3c6, 1);
  light2.position.set(
    sphere.center.x,
    sphere.center.y,
    sphere.center.z - sphere.radius
  );
  light2.target.position.copy(sphere.center);
  scene.add(light2);

  //overall ligthing
  scene.add(new THREE.AmbientLight(0xfdf3c6, 2));
}
