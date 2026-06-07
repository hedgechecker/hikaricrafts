export class CursorManager {
  private domElement: HTMLElement;


  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.domElement.style.cursor = "default";
  }

  public setCursor(type: string) {
    this.domElement.style.cursor = type;
  }

}
