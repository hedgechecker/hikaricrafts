import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createPanelFrame } from "./Objects/Frame";
import { createGrid } from "./Objects/Grid";
import { addControls, createCamera, addLighting } from "./Utils/SceneUtils";
import {
  addClickHandle,
  addHoverHandle,
  addKeyBoardInput,
} from "./Utils/EventUtils";
import { createPattern } from "./Objects/CanvasPatterns";
import styles from "./CanvasThree.module.css";
import { clearScene, load, loadPanel, savePanel } from "./Utils/StorageUtils";
import { getSceneXY, mergeGroup, parseXYZ } from "./Utils/MathUtils";
import { CSG } from "three-csg-ts";
import { threeRefs } from "./ThreeRefs";

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
  const mountRef = useRef<HTMLDivElement>(document.createElement("div"));
  const materialMapRef = useRef<number[]>([]);

  // Persist these across renders
  // const sceneRef = useRef<THREE.Scene>(null);
  // const rendererRef = useRef<THREE.WebGLRenderer>(null);
  // const cameraRef = useRef<THREE.Camera>(null);
  // const controlRef = useRef<OrbitControls>(null);
  // const patternRef = useRef<THREE.Object3D>(new THREE.Object3D());
  // const eraserRef = useRef<boolean>(false);
  // var sphereRef = useRef<THREE.Sphere>(new THREE.Sphere());

  const panelConfig = panelSize;

  // Initialize scene, camera, and renderer once
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    const camera = createCamera(mountRef.current);

    threeRefs.scene.current = scene;
    threeRefs.renderer.current = renderer;
    threeRefs.camera.current = camera;

    //update the Camera to keep the proportions
    window.onresize = () => {
      const renderer = threeRefs.renderer.current;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      // Update camera aspect and projection matrix
      if (threeRefs.camera.current instanceof THREE.PerspectiveCamera) {
        threeRefs.camera.current.aspect = width / height;
        threeRefs.camera.current.updateProjectionMatrix();
      }
    };
    change3D();
    resetView();
  }, []);

  // Set up scene contents and render loop
  useEffect(() => {
    setIsSceneReady(!isSceneReady);

    console.log("new DIMENSIONS");

    const renderer = threeRefs.renderer.current;
    const scene = threeRefs.scene.current;
    const camera = threeRefs.camera.current;

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
    threeRefs.sphere.current = sphere;
    camera.position.z = sphere.radius * 1.5;
    camera.lookAt(sphere.center);

    addLighting(scene, sphere);
    resetView();

    const animate = () => {
      const renderer = threeRefs.renderer.current;
      const controls = threeRefs.controls.current;
      requestAnimationFrame(animate);
      renderer.render(threeRefs.scene.current, threeRefs.camera.current);
      controls.update();
    };
    animate();

    fillInPatterns();

    return () => {
      const renderer = threeRefs.renderer.current;
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
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
    const mount = mountRef.current;
    const cleanup = addHoverHandle( mount, panelConfig);
    const cleanup2 = addKeyBoardInput(panelConfig);
    return () =>{ 
      cleanup();
      cleanup2();
    }
  }, [isSceneReady, is3D]);

  useEffect(() => {
    materialMapRef.current = materialMap;
    threeRefs.scene.current.remove(threeRefs.pattern.current);
    threeRefs.eraser.current = patternIndex == 0;
    threeRefs.pattern.current = createPattern(
      patternIndex,
      {
        spacing: panelConfig.spacing,
        depth: panelConfig.depth - 0.5,
        lineWidth: panelConfig.lineWidth,
      },
      true,
      materialMapRef.current
    );
    threeRefs.scene.current.add(threeRefs.pattern.current);
    threeRefs.pattern.current.position.set(100000, 100000, 100000);
    const cleanup = addClickHandle(
      patternIndex,
      materialMap,
      panelConfig
    );
    return cleanup;
  }, [materialMap, patternIndex, isSceneReady]);

  function resetView() {
    const camera = threeRefs.camera.current;
    if (!is3D) {
      camera.position.set(0, 0, 1.8 * threeRefs.sphere.current.radius);
      camera.lookAt(threeRefs.sphere.current.center);
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

    
      threeRefs.controls.current.target.set(0, 0, 0);
      threeRefs.controls.current.update();
    
  }

  function change3D() {
    if (is3D) {
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
      threeRefs.camera.current = camera;
      if (threeRefs.controls.current) threeRefs.controls.current.dispose();
      threeRefs.controls.current = addControls(
        camera,
        threeRefs.renderer.current,
        threeRefs.sphere.current,
        panelConfig
      );
      threeRefs.controls.current.enableRotate = false;
      console.log("Disable Rotat");
    } else {
      (document.getElementById("3Dbtn") as HTMLElement).innerHTML = "3D";
      setIs3D(true);
      const camera = createCamera(mountRef.current);
      camera.position.z = threeRefs.sphere.current.radius * 1.5;
      camera.lookAt(threeRefs.sphere.current.center);
      threeRefs.camera.current = camera;
      if (threeRefs.controls.current) threeRefs.controls.current.dispose();
      threeRefs.controls.current = addControls(
        camera,
        threeRefs.renderer.current,
        threeRefs.sphere.current,
        panelConfig
      );
      threeRefs.controls.current.enableRotate = true;
      console.log("ebnale Rotat");
    }
  }

  function fillInPatterns() {
    const cuttingTool = createPanelFrame({
    width: panelConfig.width + 20000,
    height: panelConfig.height + 20000,
    depth: 200,
    frameWidth: panelConfig.frameWidth +10000,
    lineWidth: 0,
    spacing: 0,
  });
  cuttingTool.updateMatrix();
    console.time();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i); // get the key name
      if (!key) continue;
      const value = load(key); // get the value
      if (!value) continue;
      const pos = parseXYZ(key);
      if (!pos) continue;
      const scenePos = getSceneXY(pos, panelConfig);
      if(scenePos.pos.x > panelSize.width /2 || scenePos.pos.x < -panelSize.width /2
         || scenePos.pos.y > panelSize.height /2 || scenePos.pos.y < -panelSize.height /2 
      ) continue;
      var item = createPattern(
        value.patternIndex,
        panelConfig,
        false,
        value.materialMap
      ) as THREE.Object3D;
      item.position.copy(scenePos.pos);
      item.rotation.z = (Math.PI / 3) * value.rotation;
      item.updateMatrix();
      if(scenePos.pos.x > panelSize.width /2 - panelConfig.spacing || scenePos.pos.x < -panelSize.width /2 + panelConfig.spacing
         || scenePos.pos.y > panelSize.height /2 - panelConfig.spacing || scenePos.pos.y < -panelSize.height /2 + panelConfig.spacing 
      ) {
        const group = mergeGroup(item as THREE.Group);
        item = CSG.subtract(group, cuttingTool);
      }
      itemsById.set(key, item);
      threeRefs.scene.current.add(item);
    }
    console.timeLog();
    console.timeEnd();
  }

  return (
    <>
      <div className={styles.navbar}>
        <button className={`${styles.button} ${styles.tooltip}`} onClick={clearScene} data-tooltip="Clear Scene">
          <img src="./src/assets/clearScene.svg" className={styles.image} />
        </button>
        <button className={`${styles.button} ${styles.tooltip}`} onClick={loadPanel} data-tooltip="Load File">
          <img src="./src/assets/folder.svg" className={styles.image} />
        </button>
        <button className={`${styles.button} ${styles.tooltip}`} onClick={savePanel} data-tooltip="Save File">
          <img src="./src/assets/saveIcon.png" className={styles.image} />
        </button>
        <button className={`${styles.button} ${styles.tooltip}`} onClick={resetView} data-tooltip="Reset View">
          <img src="./src/assets/home.png" className={styles.image} />
        </button>
        <button className={`${styles.button} ${styles.tooltip}`} onClick={change3D} id="3Dbtn" data-tooltip="Change View">
          3D
        </button>
      </div>
      <div ref={mountRef} style={{ width: "100%", height: "80vh" }} />
    </>
  );
};

export default CanvasThree;
