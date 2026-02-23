import { randInt } from "three/src/math/MathUtils.js";

export const generateId = () => randInt(0,1000000).toString();
