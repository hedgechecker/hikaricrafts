import * as THREE from "three";

export function enablePanZoom(
  camera: THREE.OrthographicCamera,
  domElement: HTMLElement
) {
  let isDragging = false;
  let previous = { x: 0, y: 0 };

  domElement.addEventListener("mousedown", e => {
    isDragging = true;
    previous = { x: e.clientX, y: e.clientY };
  });

  domElement.addEventListener("mouseup", () => {
    isDragging = false;
  });

  domElement.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  domElement.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const dx = e.clientX - previous.x;
    const dy = e.clientY - previous.y;

    const rect = domElement.getBoundingClientRect();

    const visibleWidth =
      (camera.right - camera.left) / camera.zoom;
    const visibleHeight =
      (camera.top - camera.bottom) / camera.zoom;

    const worldPerPixelX = visibleWidth / rect.width;
    const worldPerPixelY = visibleHeight / rect.height;

    camera.position.x -= dx * worldPerPixelX;
    camera.position.y += dy * worldPerPixelY;

    previous = { x: e.clientX, y: e.clientY };
  });

  domElement.addEventListener("wheel", e => {
    e.preventDefault();

    const zoomFactor = 1 + e.deltaY * 0.001;

    camera.zoom = Math.max(0.2, Math.min(5, camera.zoom / zoomFactor));
    camera.updateProjectionMatrix();
  });
}
