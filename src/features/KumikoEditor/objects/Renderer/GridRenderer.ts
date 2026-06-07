import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { BaseRenderer, type RenderData } from "./BaseRenderer";
import type { SceneManager } from "../SceneManager";
import type { Settings } from "../../models/Settings";
import { getFastMaterial } from "../../utils/materials";
import {
  distanceBetweenParallels,
  getGridXYZ,
  isZnegative,
} from "../../utils/math";
import type { PatternPos } from "../../models/Pattern";

interface GridRenderData extends RenderData {
  mesh: THREE.Group;
}

export class GridRenderer extends BaseRenderer<GridRenderData, Settings> {
  private hoveredPos: PatternPos | null = null;
  constructor(sceneManager: SceneManager) {
    super(sceneManager);
  }

  protected getId() {
    return "grid";
  }
  public addFromData(settings: Settings) {
    const grid = this.objects.get("grid");
    if (grid) this.sceneManager.scene.remove(grid.mesh);
    this.createGrid(settings);
  }
  updateFromData(settings: Settings) {
    const grid = this.objects.get("grid");
    if (!grid) return;

    this.sceneManager.scene.remove(grid.mesh);

    this.createGrid(settings);
  }

  /** Creates a Frame with size (width x height) and a thickness of (framewidth), the framewidth is built inwards,
   * so the total size of the frame stays (width x height)
   * @param height the height of the frame
   * @param width the width of the frame
   * @param depth the depth of the frame
   * @param frameWidth the outside width
   * @returns THREE.Mesh
   */
  static createPanelFrame(settings: Settings) {
    //the frame gets created with a smaller rectangle cut out from a bigger rectangle
    const outerGeometry = new THREE.BoxGeometry(
      settings.width,
      settings.height,
      settings.depth,
    );
    const innerGeometry = new THREE.BoxGeometry(
      settings.width - 2 * settings.frameWidth,
      settings.height - 2 * settings.frameWidth,
      settings.depth,
    );

    const outerMesh = new THREE.Mesh(outerGeometry);
    const innerMesh = new THREE.Mesh(innerGeometry);
    //subtract the meshes
    const frameMesh = CSG.subtract(outerMesh, innerMesh);

    frameMesh.material = getFastMaterial("Fichte");

    return frameMesh;
  }

  private createGrid(settings: Settings) {
    const material = getFastMaterial("Fichte");
    const height = settings.height - 2 * settings.frameWidth;
    const width = settings.width - 2 * settings.frameWidth;
    //--------------------Constants --------------------
    //height of the equilateral triangles
    const triangleHeight = Math.sqrt(
      settings.spacing * settings.spacing -
        ((settings.spacing / 2) * settings.spacing) / 2,
    );
    //Maximum needed height between the diagonal lines
    const diagonal =
      (Math.max(width, height) * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 4);
    //c = b × sin gamma / sin beta
    const sideC =
      (triangleHeight * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 3);
    //a = c × sin alpha / sin gamma
    //used to stagger the diagonal lines, before rotating them,to match the rotation
    const bias = (sideC * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 2);

    const lineSideC = (height * Math.sin(Math.PI / 6)) / Math.sin(Math.PI / 3);
    const lineLength =
      ((lineSideC * Math.sin(Math.PI / 2)) / Math.sin(Math.PI / 6)) * 2;

    //used to perform the cutting action on the different grid types
    const cuttingTool = GridRenderer.createPanelFrame({
      width: width + 20000,
      height: height + 20000,
      depth: 200,
      frameWidth: 10000,
      lineWidth: 0,
      spacing: 0,
    });
    cuttingTool.updateMatrix();

    //--------------------Type 1 - Horizontal lines--------------------
    //very simple, just add the lines from top to bottom and cut them to size
    const GroupType1 = new THREE.Group();
    for (
      let y = height / 2 - triangleHeight;
      y >= -height / 2 + settings.lineWidth;
      y -= triangleHeight
    ) {
      const lineGeometry = new THREE.BoxGeometry(
        width,
        settings.lineWidth,
        settings.depth,
      );
      const line = new THREE.Mesh(lineGeometry, material);
      line.position.set(0, y, 0);
      line.updateMatrix();
      const line2 = CSG.subtract(line, cuttingTool);
      GroupType1.add(line2);
    }
    //--------------------Type 2 - 120 degrees lines--------------------

    const GroupType2 = new THREE.Group();

    cuttingTool.rotation.z = -Math.PI / 6; // Rotate -30 degrees
    cuttingTool.updateMatrix();

    //calculate the starting point to match the top left corner
    let distToEdgeType2 = distanceBetweenParallels(
      0,
      0,
      -width / 2,
      height / 2,
      (Math.PI * 2) / 3,
    );
    //check if the center point is beneath the 60deg line drawn from the top left panelPoint => in the negative way
    if (isZnegative(settings, new THREE.Vector2(0, 0))) {
      distToEdgeType2 = -distToEdgeType2;
    }

    ///get the start Offset
    const offsetXType2 =
      Math.ceil((diagonal / 2 - distToEdgeType2) / triangleHeight) *
      triangleHeight;
    const startXType2 = distToEdgeType2 + offsetXType2;

    for (let x = -startXType2; x <= diagonal / 2; x += triangleHeight) {
      const lineGeometry = new THREE.BoxGeometry(
        lineLength,
        settings.lineWidth,
        settings.depth,
      );
      const line = new THREE.Mesh(lineGeometry);

      //adding the lines from bottom to top and shift a bit further, so they match the rotation
      line.position.set(x, -bias * (x / triangleHeight), 0);
      line.rotation.z = -Math.PI / 2; // Rotate 90 degrees
      line.updateMatrix();

      const line2 = CSG.subtract(line, cuttingTool);
      line2.material = material;
      GroupType2.add(line2);
    }
    GroupType2.rotation.z = Math.PI / 6; // Rotate 30 degrees

    //--------------------Type 3 - 60 degrees lines--------------------
    const GroupType3 = new THREE.Group();

    cuttingTool.rotation.z = Math.PI / 6; // Rotate 30 degrees
    cuttingTool.updateMatrix();

    //calculate the starting point to match the top left corner
    const distToEdgeType3 = distanceBetweenParallels(
      0,
      0,
      -width / 2,
      height / 2,
      Math.PI / 3,
    );
    const offsetXType3 = triangleHeight - (distToEdgeType3 % triangleHeight);
    const startXType3 =
      Math.ceil(distToEdgeType3 / triangleHeight) * triangleHeight -
      offsetXType3;

    for (let x = -startXType3; x <= diagonal / 2; x += triangleHeight) {
      const lineGeometry = new THREE.BoxGeometry(
        lineLength,
        settings.lineWidth,
        settings.depth,
      );
      const line = new THREE.Mesh(lineGeometry);

      //adding the lines from bottom to top and shift a bit further, so they match the rotation
      line.position.set(x, bias * (x / triangleHeight), 0);
      line.rotation.z = -Math.PI / 2;
      line.updateMatrix();

      const line2 = CSG.subtract(line, cuttingTool);
      line2.material = material;
      GroupType3.add(line2);
    }
    GroupType3.rotation.z = -Math.PI / 6; // Rotate -30 degrees

    //for anti-aliasing
    GroupType2.position.z = -0.01;
    GroupType3.position.z = -0.02;

    GroupType2.updateMatrix();
    GroupType3.updateMatrix();

    var mesh = new THREE.Group().add(GroupType1, GroupType2, GroupType3);
    const panelFrame = GridRenderer.createPanelFrame(settings);
    mesh.add(panelFrame);

    const data: GridRenderData = {
      mesh,
      isHovered: false,
      isSelected: false,
      isInValid: false,
    };

    this.objects.set("grid", data);

    data.mesh.visible = this.visible;
    this.sceneManager.scene.add(mesh);
  }

  snapToGrid(worldPos: THREE.Vector3) {
    if (!this.visible) return null;
    return getGridXYZ(worldPos.x, worldPos.y, this.sceneManager.settings);
  }

  handleHover(event: MouseEvent): boolean {
    const worldPos = this.sceneManager.getWorldPosition(event);
    const insideFrame =
      worldPos.x < this.sceneManager.settings.width / 2 &&
      worldPos.x > -this.sceneManager.settings.width / 2 &&
      worldPos.y < this.sceneManager.settings.height / 2 &&
      worldPos.y > -this.sceneManager.settings.height / 2;
    const snapped = this.snapToGrid(worldPos);
    this.hoveredPos = snapped;

    return snapped !== null && insideFrame;
  }

  getHoveredPos() {
    return this.hoveredPos;
  }
}
