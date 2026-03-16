import * as THREE from 'three';
import { PointRenderer } from './PointRenderer';
import type { SceneManager } from '../SceneManager';
import { BaseRenderer, type RenderData } from './BaseRenderer';
import type { LineData } from '../../models/Line';

interface LineRenderData extends RenderData {
  startPointId: string;
  endPointId: string;
  mesh: THREE.Group;
}

export class LineRenderer extends BaseRenderer<LineRenderData, LineData> {
  private pointManager: PointRenderer;

  private readonly baseThickness = 0.02;
  private readonly hoverThickness = 0.05;
  private color = '#000000';

  constructor(sceneManager: SceneManager, pointManager: PointRenderer) {
    super(sceneManager);
    this.pointManager = pointManager;
  }

  protected getId(data: LineData) {
    return data.id;
  }
  protected addFromData(data: LineData) {
    this.addLine(data.startPointId, data.endPointId, data.id);
  }
  protected updateFromData(data: LineData) {
    this.updateConnection(data.id, data.startPointId, data.endPointId);
  }

  addLine(startPointId: string, endPointId: string, id: string) {
    const group = new THREE.Group();
    group.userData.id = id;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
    });
    const lineMesh = new THREE.Mesh(geometry, material);
    lineMesh.name = 'visual';

    const hitGeometry = new THREE.BoxGeometry(1, 10, 1);
    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitboxMesh = new THREE.Mesh(hitGeometry, hitMaterial);
    hitboxMesh.name = 'hitbox';

    group.add(lineMesh);
    group.add(hitboxMesh);
    this.sceneManager.scene.add(group);

    this.objects.set(id, {
      startPointId: startPointId,
      endPointId: endPointId,
      mesh: group,
      isHovered: false,
      isSelected: false,
      isInValid: false,
    });

    this.updateLineGeometry(id);
  }

  //NEEEE
  public getConnectedPoints(pointId: string): string[] {
    const connected: string[] = [];
    for (const [, line] of this.objects) {
      if (line.startPointId === pointId) {
        connected.push(line.endPointId);
      } else if (line.endPointId === pointId) {
        connected.push(line.startPointId);
      }
    }
    return connected;
  }

  public getFirstHoverableLine(intersects: THREE.Intersection[]): string | null {
    const selectedPoints = this.pointManager.getSelected();
    for (const hit of intersects) {
      const id = hit.object.parent?.userData.id;
      if (!id) continue;

      //check if Line is connected to the selected Point
      const connected = selectedPoints.some((point) => {
        const line = this.objects.get(id);
        if (!line) return false;

        return line.startPointId === point || line.endPointId === point;
      });
      if (connected) continue;

      return id;
    }
    return null;
  }

  //NEEE
  public hasLineBetween(a: string, b: string): boolean {
    for (const [, line] of this.objects) {
      const s = line.startPointId;
      const e = line.endPointId;

      if ((s === a && e === b) || (s === b && e === a)) {
        return true;
      }
    }

    return false;
  }

  update() {
    for (const [id] of this.objects) {
      this.updateLineGeometry(id);
    }
  }

  updateConnection(id: string, startPointId: string, endPointId: string) {
    const line = this.objects.get(id);
    if (!line) return;

    line.startPointId = startPointId;
    line.endPointId = endPointId;

    this.updateLineGeometry(id);
  }

  private updateLineGeometry(id: string) {
    const data = this.objects.get(id);
    if (!data) return;

    const startPos = this.pointManager.getWorldPosition(data.startPointId);
    const endPos = this.pointManager.getWorldPosition(data.endPointId);

    if (!startPos || !endPos) return;

    const mesh = data.mesh;

    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const length = direction.length();

    if (length === 0) return;

    // Position: midpoint
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    mesh.position.copy(midpoint);

    // Orientation: align X axis to direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize());
    mesh.setRotationFromQuaternion(quaternion);

    // Scale:
    // X = length
    // Y = thickness
    // Z = thickness (gives slight depth)
    const thickness =
      this.hovered === id ? this.hoverThickness / this.zoom : this.baseThickness / this.zoom;

    mesh.scale.set(length, thickness, thickness);
  }

  updateScale(zoom: number) {
    this.zoom = zoom;
    for (const [id, line] of this.objects) {
      const startPos = this.pointManager.getWorldPosition(line.startPointId);
      const endPos = this.pointManager.getWorldPosition(line.endPointId);

      if (!startPos || !endPos) continue;

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();

      if (length === 0) continue;

      const thickness =
        this.hovered === id ? this.hoverThickness / zoom : this.baseThickness / zoom;
      line.mesh.scale.set(length, thickness, thickness);

      if (line.isInValid) {
        this.setColor(id, this.colorInValid);
      } else {
        this.setColor(id, this.color);
      }
    }
  }

  setColorAll(color: string) {
    if (this.color == color) return;
    this.color = color;

    this.objects.forEach((_point, id) => {
      this.setColor(id, color);
    });
  }

  setColor(id: string, color: string) {
    const newColor = new THREE.Color(color);

    const line = this.objects.get(id);
    if (!line) return;
    const visual = line.mesh.getObjectByName('visual');

    if (visual && (visual as THREE.Mesh).material) {
      ((visual as THREE.Mesh).material as THREE.Material & { color: THREE.Color }).color.copy(
        newColor,
      );
    }
  }

  handleHover(event: MouseEvent): boolean {
    const rect = this.sceneManager.dom.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, this.sceneManager.camera);

    const intersects = raycaster.intersectObjects(this.getHitboxes(), false);
    const hoveredLine = this.getFirstHoverableLine(intersects);
    if (hoveredLine) {
      this.setHovered(hoveredLine);
      return true;
    }
    return false;
  }
}
