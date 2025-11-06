// ThreeRefs.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * LazyRef automatically initializes the value on first access
 */
export class LazyRef<T> {
  private _value: T | null = null;
  readonly factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get current(): T {
    if (this._value === null) {
      this._value = this.factory();
    }
    return this._value;
  }

  set current(val: T) {
    this._value = val;
  }
}

export type ThreeRefsType = {
  scene: LazyRef<THREE.Scene>;
  renderer: LazyRef<THREE.WebGLRenderer>;
  camera: LazyRef<THREE.PerspectiveCamera|THREE.OrthographicCamera>;
  controls: LazyRef<OrbitControls>;
  pattern: LazyRef<THREE.Object3D>;
  eraser: LazyRef<boolean>;
  sphere: LazyRef<THREE.Sphere>;
};

function createThreeRefs(): ThreeRefsType {
  const scene = new LazyRef(() => new THREE.Scene());
  const renderer = new LazyRef(() => new THREE.WebGLRenderer());
  const camera = new LazyRef(() => new THREE.PerspectiveCamera());
  const pattern = new LazyRef(() => new THREE.Object3D());
  const eraser = new LazyRef(() => false);
  const sphere = new LazyRef(() => new THREE.Sphere());

  const controls = new LazyRef(
    () => new OrbitControls(camera.current, document.createElement("div"))
  );

  return { scene, renderer, camera, controls, pattern, eraser, sphere };
}

export const threeRefs = createThreeRefs();

