import Card from "./Card";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { addLighting } from "./CanvasThree/Utils/SceneUtils";
import type { PatternConfig } from "./CanvasThree/Utils/InterfaceUtils";
import { createPattern } from "./CanvasThree/Objects/CanvasPatterns";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import styles from "./styles/PatternEditor.module.css";
import {
  getMaterial,
  getOpaqueMaterial,
} from "./CanvasThree/Objects/Materials";

interface EditorProps {
  index: number;
  panelSize: {
    width: number;
    height: number;
    spacing: number;
    depth: number;
    frameWidth: number;
    lineWidth: number;
  };
  setMaterialMap: React.Dispatch<React.SetStateAction<number[]>>;
  materialMap: number[];
}

export default function EditorPanel({
  index,
  panelSize,
  setMaterialMap,
  materialMap,
}: EditorProps) {
  //Same Functioning Way as CanvasThree except with a MaterialMap
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const controlRef = useRef<OrbitControls>(null);
  const patternRef = useRef<THREE.Group>(new THREE.Group());
  const selectedMaterialRef = useRef<number>(0);
  const [materialCard, setMaterialCard] = useState(0);

  const spacing = panelSize.spacing;
  const triangleHeight = Math.sqrt(
    spacing * spacing - ((spacing / 2) * spacing) / 2
  );

  const materials = [
    { index: 0, name: "Fichte", img: "./src/assets/fichte.jpg" },
    { index: 1, name: "Eiche", img: "./src/assets/eiche.jpg" },
    { index: 2, name: "Douglasie", img: "./src/assets/douglasie.jpg" },
  ];
  var localMaterialMap: number[] = [];

  //on first Load add camera, controls and scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );

    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = spacing; // like zoom level
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, // left
      (frustumSize * aspect) / 2, // right
      frustumSize / 2, // top
      frustumSize / -2, // bottom
      0.1, // near
      5000 // far
    );

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlRef.current = controls;

    //Only turn a bit right/left
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI * (1 / 4);
    controls.maxAzimuthAngle = Math.PI * (1 / 4);

    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };
    animate();

    return () => {
      isMounted = false;
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      controls.dispose();
    };
  }, []);

  //update Pattern and Camera on new Pattern
  useEffect(() => {
    if (!mountRef.current) return;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const controls = controlRef.current;
    if (!camera || !renderer || !scene || !controls) return;

    const pattern = createPattern(index, {
      depth: panelSize.depth,
      lineWidth: panelSize.lineWidth,
      spacing: panelSize.spacing,
      materialMap: materialMap,
    } as PatternConfig);
    const border = createPattern(-1, {
      depth: panelSize.depth,
      lineWidth: panelSize.lineWidth,
      spacing: panelSize.spacing,
    } as PatternConfig);
    pattern.position.y = -triangleHeight / 6;
    border.position.y = -triangleHeight / 6;
    pattern.position.z = -panelSize.depth / 2;
    border.position.z = -panelSize.depth / 2;
    pattern.updateMatrix();
    border.updateMatrix();
    scene.add(pattern);
    scene.add(border);
    patternRef.current = pattern;

    const elements = pattern.children;
    for (var i = 0; i < elements.length; i++) {
      if (materialMap[i]) {
        localMaterialMap[i] = materialMap[i];
      } else {
        localMaterialMap[i] = 0;
      }
      (elements.at(i) as THREE.Mesh).material = getMaterial(
        localMaterialMap[i]
      );
    }
    pattern.updateMatrix();

    const boundingBox = new THREE.Box3().setFromObject(border);
    const sphere = boundingBox.getBoundingSphere(new THREE.Sphere());

    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = spacing; // like zoom level
    camera.left = (frustumSize * aspect) / -2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    camera.position.z = sphere.radius * 3;
    camera.lookAt(sphere.center);

    sphere.radius = 100;
    addLighting(scene, sphere);

    const cleanup = addHoverHandle(camera, renderer);

    return () => {
      scene.clear();
      cleanup();
      console.log("EDITOR SCENE CLEARED");
    };
  }, [panelSize]);

  useEffect(() => {
    sceneRef.current?.remove(patternRef.current);
    const pattern = createPattern(index, {
      depth: panelSize.depth,
      lineWidth: panelSize.lineWidth,
      spacing: panelSize.spacing,
      materialMap: materialMap,
    } as PatternConfig);
    patternRef.current = pattern;
    sceneRef.current?.add(pattern);
    pattern.position.y = -triangleHeight / 6;
    pattern.position.z = -panelSize.depth / 2;
    const elements = pattern.children;
    for (var i = 0; i < elements.length; i++) {
      if (materialMap[i]) {
        localMaterialMap[i] = materialMap[i];
      } else {
        localMaterialMap[i] = 0;
      }
      (elements.at(i) as THREE.Mesh).material = getMaterial(
        localMaterialMap[i]
      );
    }
    pattern.updateMatrix();
  }, [index]);

  //Make Parts invisible on Hover and change Material on Click
  function addHoverHandle(
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
  ) {
    var lastX = 0;
    var lastY = 0;
    var lastIndex: number | null = null;

    const mouse = new THREE.Vector2();
    let offsetX = 0;
    let offsetY = 0;
    const raycaster = new THREE.Raycaster();

    if (mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      offsetX = rect.x;
      offsetY = rect.y;
    }

    function onMouseMove(event: MouseEvent) {
      const elements = patternRef.current.children;
      const selectedMaterial = selectedMaterialRef.current;
      mouse.x =
        ((event.clientX - offsetX) / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y =
        -((event.clientY - offsetY) / renderer.domElement.clientHeight) * 2 + 1;
      camera.updateMatrixWorld();
      raycaster.setFromCamera(mouse, camera);

      var closestDist = 100000000;
      var closest = -1;
      for (var i = 0; i < elements.length; i++) {
        const element = elements.at(i) as THREE.Object3D;
        const intersects = raycaster.intersectObject(element);
        if (intersects.length > 0 && intersects[0].distance < closestDist) {
          closestDist = intersects[0].distance;
          closest = i;
        }
      }

      if (closest >= 0) {
        if (closest === lastIndex) {
          return;
        }
        const element = elements.at(closest) as THREE.Object3D;
        if (!(element as THREE.Mesh).isMesh) return;
        const mesh = element as THREE.Mesh;
        if (lastIndex != null)
          (elements.at(lastIndex) as THREE.Mesh).material = getMaterial(
            localMaterialMap[lastIndex] as number
          );

        mesh.material = getOpaqueMaterial(selectedMaterial);
        lastIndex = closest;
        return;
      }
      if (lastIndex != null) {
        (elements.at(lastIndex) as THREE.Mesh).material = getMaterial(
          localMaterialMap[lastIndex] as number
        );
        lastIndex = null;
      }
    }

    function onMouseDown(event: MouseEvent) {
      lastX = event.clientX;
      lastY = event.clientY;
    }
    function onMouseUp(event: MouseEvent) {
      if (
        Math.abs(event.clientX - lastX) > 2 ||
        Math.abs(event.clientY - lastY) > 2
      ) {
        return;
      }
      const elements = patternRef.current.children;

      const selectedMaterial = selectedMaterialRef.current;
      if (lastIndex != null) {
        localMaterialMap[lastIndex] = selectedMaterial;
        (elements.at(lastIndex) as THREE.Mesh).material = getMaterial(
          localMaterialMap[lastIndex] as number
        );
        var neww: number[] = [];
        for (var i = 0; i < localMaterialMap.length; i++) {
          neww[i] = localMaterialMap[i];
        }
        console.log("Set Material " + localMaterialMap);
        setMaterialMap(neww);
        lastIndex = null;
      }
    }
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mousedown", onMouseDown);

    return () => {
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
    };
  }

  return (
    <Card title="Pattern Editor" padding foldable>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "5px",
            top: "5px",
            zIndex: 9999,
          }}
        >
          <img
            src="./src/assets/arrows.png"
            style={{ width: "25px", height: "25px" }}
          ></img>
        </div>
        <div ref={mountRef} style={{ width: "100%", height: "20vh" }} />
        <div className={styles.materialGrid}>
          {materials.map((material) => (
            <Card key={material.name} selected={material.index == materialCard}>
              <div
                className={styles.buttondiv}
                style={
                  material.index % 2 == 0
                    ? { flexDirection: "row" }
                    : { flexDirection: "row-reverse" }
                }
                onClick={() => {
                  selectedMaterialRef.current = material.index;
                  setMaterialCard(material.index);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    selectedMaterialRef.current = material.index;
                    setMaterialCard(material.index);
                  }
                }}
              >
                <div style={{ padding: "4px" }}>{material.name}</div>
                <div
                  tabIndex={0}
                  role="button"
                  className={styles.container}
                  style={{
                    backgroundImage: `url(${material.img})`,
                  }}
                ></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}
