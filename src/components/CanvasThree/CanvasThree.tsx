import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createPanelFrame } from "./Objects/Frame";
import { createGrid } from "./Objects/Grid";
import { addControls, createCamera, addLighting } from "./Utils/SceneUtils";
import { addClickHandle, addHoverHandle } from "./Utils/EventUtils";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPattern } from "./Objects/CanvasPatterns";
import styles from "./CanvasThree.module.css";
import { load } from "./Utils/StorageUtils";
import { getSceneXY } from "./Utils/MathUtils";

export const itemsById = new Map<string, THREE.Object3D>();

interface CanvasProps {
  panelSize: {
    width: number;
    height: number;
    spacing: number;
    depth: number;
    frameWidth: number;
    lineWidth: number;
  };
  patternIndex: number;
  materialMap: number[];
}

/**
 * Manages all states and updates on new inputs
 * @param panelSize the dimensions
 * @param patternIndex the currently previewed Pattern
 * @returns the Canvas Div
 */
const CanvasThree = ({ panelSize, patternIndex, materialMap }: CanvasProps) => {
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const materialMapRef = useRef<number[]>([]);

  // Persist these across renders
  const sceneRef = useRef<THREE.Scene>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const cameraRef = useRef<THREE.Camera>(null);
  const controlRef = useRef<OrbitControls>(null);
  const patternRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const eraserRef = useRef<boolean>(false);
  const panelConfig = panelSize;
  var sphereRef = useRef<THREE.Sphere>(new THREE.Sphere());

  // Initialize scene, camera, and renderer once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    const camera = createCamera(mountRef.current);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    //update the Camera to keep the proportions
    window.onresize = () => {
      const renderer = rendererRef.current;
      if (!mountRef.current || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      // Update camera aspect and projection matrix
      if (cameraRef.current instanceof THREE.PerspectiveCamera) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
  }, []);

  // Set up scene contents and render loop
  useEffect(() => {
    setIsSceneReady(!isSceneReady);

    console.log("new DIMENSIONS");
    if (
      !mountRef.current ||
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current
    ) {
      console.log("A Ref is null");
      console.log("Mountref: " + mountRef);
      console.log("rendererref: " + rendererRef);
      console.log("sceneref: " + sceneRef);
      console.log("cameraref: " + cameraRef);
      return;
    }

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Clear old content
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const panelFrame = createPanelFrame(panelConfig);
    const grid = createGrid(panelConfig);
    scene.add(panelFrame);
    scene.add(grid);

    //Check if a frame is given or if its 0 width
    const boundingBox =
      panelConfig.frameWidth != 0
        ? new THREE.Box3().setFromObject(panelFrame)
        : new THREE.Box3().setFromObject(grid);
    const sphere = boundingBox.getBoundingSphere(new THREE.Sphere());
    sphereRef.current = sphere;
    camera.position.z = sphere.radius * 1.5;
    camera.lookAt(sphere.center);

    addLighting(scene, sphere);
    const controls = addControls(camera, renderer, sphere, panelConfig);
    controlRef.current = controls;

    let isMounted = true;
    const animate = () => {
      const renderer = rendererRef.current;
      const controls = controlRef.current;
      if (
        !isMounted ||
        !controls ||
        !cameraRef.current ||
        !sceneRef.current ||
        !renderer
      )
        return;
      requestAnimationFrame(animate);
      renderer.render(sceneRef.current, cameraRef.current);
      controls.update();
    };
    animate();

    //Add movement throug the arrow keys
    const panSpeed = 10;
    const handleKeyDown = (event: KeyboardEvent) => {
      const offset = new THREE.Vector3();

      switch (event.key) {
        case "ArrowUp":
          offset.set(0, panSpeed, 0);
          break;
        case "ArrowDown":
          offset.set(0, -panSpeed, 0);
          break;
        case "ArrowLeft":
          offset.set(-panSpeed, 0, 0);
          break;
        case "ArrowRight":
          offset.set(panSpeed, 0, 0);
          break;
        default:
          return;
      }

      const camera = cameraRef.current;
      const controls = controlRef.current;
      if (!camera || !controls) return;
      // Apply the pan to both camera and target (so the scene doesn't rotate)
      camera.position.add(offset);
      controls.target.add(offset);
      controls.update();
    };
    window.addEventListener("keydown", handleKeyDown);

    fillInPatterns();

    return () => {
      isMounted = false;
      const renderer = rendererRef.current;
      if (!renderer) return;
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      controls.dispose();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    panelSize.width,
    panelSize.height,
    panelSize.spacing,
    panelSize.frameWidth,
  ]);

  // Handle hover pattern changes
  useEffect(() => {
    console.log("NEWHOVERHANDLE");
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const mount = mountRef.current;
    if (!camera || !renderer || !scene || !mount) return;
    const cleanup = addHoverHandle(
      camera,
      renderer,
      scene,
      mount,
      panelConfig,
      patternRef,
      eraserRef
    );
    return cleanup;
  }, [isSceneReady, is3D]);

  useEffect(() => {
    materialMapRef.current = materialMap;
    sceneRef.current?.remove(patternRef.current);
    eraserRef.current = patternIndex == 0;
    patternRef.current = createPattern(
      patternIndex,
      {
        spacing: panelConfig.spacing,
        depth: panelConfig.depth - 0.5,
        lineWidth: panelConfig.lineWidth,
      },
      true,
      materialMapRef.current
    );
    sceneRef.current?.add(patternRef.current);
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    patternRef.current.position.set(100000, 100000, 100000);
    const cleanup = addClickHandle(
      rendererRef.current,
      patternIndex,
      materialMap,
      sceneRef.current,
      panelConfig
    );
    return cleanup;
  }, [materialMap, patternIndex, isSceneReady]);

  function resetView() {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    if (!is3D) {
      camera.position.set(0, 0, 1.8 * sphereRef.current.radius);
      camera.lookAt(sphereRef.current.center);
    } else {
      camera.position.set(0, 0, 1000);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
    }
    camera.updateMatrix();
    camera.updateMatrixWorld(true);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = 0.1;
      camera.updateProjectionMatrix();
    }

    if (controlRef.current) {
      controlRef.current.target.set(0, 0, 0);
      controlRef.current.update();
    }
  }

  function change3D() {
    if (!mountRef.current || !rendererRef.current) return;
    if (is3D == true) {
      (document.getElementById("3Dbtn") as HTMLElement).innerHTML = "2D";
      setIs3D(false);
      const aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      const frustumSize = panelConfig.spacing; // like zoom level
      const camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2, // left
        (frustumSize * aspect) / 2, // right
        frustumSize / 2, // top
        frustumSize / -2, // bottom
        0.1, // near
        5000 // far
      );
      camera.position.set(0, 0, 1000);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
      cameraRef.current = camera;
      if (controlRef.current) controlRef.current.dispose();
      controlRef.current = addControls(
        camera,
        rendererRef.current,
        sphereRef.current,
        panelConfig
      );
      controlRef.current.enableRotate = false;
    } else {
      (document.getElementById("3Dbtn") as HTMLElement).innerHTML = "3D";
      setIs3D(true);
      const camera = createCamera(mountRef.current);
      camera.position.z = sphereRef.current.radius * 1.5;
      camera.lookAt(sphereRef.current.center);
      cameraRef.current = camera;
      if (controlRef.current) controlRef.current.dispose();
      controlRef.current = addControls(
        camera,
        rendererRef.current,
        sphereRef.current,
        panelConfig
      );
      controlRef.current.enableRotate = true;
    }

    if (!sceneRef.current) return;
  }

  function fillInPatterns() {
    console.time();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i); // get the key name
      if (!key || !sceneRef.current) continue;
      const value = load(key); // get the value
      if (!value) continue;
      const item = createPattern(
        value.patternIndex,
        panelConfig,
        false,
        value.materialMap
      );
      const pos = parseXYZ(key);
      if (!pos) continue;
      const scenePos = getSceneXY(pos, panelConfig);
      item.position.copy(scenePos.pos);
      item.rotation.z = (Math.PI / 3) * value.rotation;
      item.updateMatrix();
      itemsById.set(key, item);
      sceneRef.current.add(item);
    }
    console.timeLog();
    console.timeEnd();
  }

  function parseXYZ(str: string) {
    const match = str.match(/X(-?\d+)Y(-?\d+)Z(-?\d+)/);
    if (!match) return null;
    const [, x, y, z] = match.map(Number);
    return { x: x, y: y, z: z };
  }

  return (
    <>
      <div className={styles.navbar}>
        <button className={styles.button} onClick={resetView}>
          <img src="./src/assets/home.png" className={styles.image} />
        </button>
        <button className={styles.button} onClick={change3D} id="3Dbtn">
          3D
        </button>
      </div>
      <div ref={mountRef} style={{ width: "100%", height: "80vh" }} />
    </>
  );
};

export default CanvasThree;
