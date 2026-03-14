import { parseMathInput } from '../utils/math';

export class InputOverlay {
  private lengthInput: HTMLInputElement;
  private angleInput: HTMLInputElement;
  private onChange: () => void;
  private focusedElement: 'length' | 'angle' = 'length';

  manualLength: number | null | undefined = null;
  manualAngle: number | null | undefined = null;

  constructor(parent: HTMLElement, onChange: () => void) {
    this.onChange = onChange;
    this.lengthInput = this.createInput();
    this.angleInput = this.createInput();

    parent.appendChild(this.lengthInput);
    parent.appendChild(this.angleInput);

    this.lengthInput.addEventListener('input', this.handleLengthInput);
    this.angleInput.addEventListener('input', this.handleAngleInput);

    this.lengthInput.addEventListener('focus', () => {
      this.focusedElement = 'length';
    });
    this.angleInput.addEventListener('focus', () => {
      this.focusedElement = 'angle';
    });
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement('input');

    input.type = 'text';
    input.style.position = 'absolute';
    input.style.pointerEvents = 'auto';
    input.style.width = '70px';
    input.style.display = 'none';

    return input;
  }

  private handleLengthInput = () => {
    const value = parseMathInput(this.lengthInput.value);
    this.manualLength = value ?? undefined;
    if (this.manualLength) this.manualLength /= 10;
    this.onChange();
  };

  private handleAngleInput = () => {
    const value = parseMathInput(this.angleInput.value);
    this.manualAngle = value ?? undefined;
    this.onChange();
  };

  show(x: number, y: number) {
    this.lengthInput.style.display = 'block';
    this.angleInput.style.display = 'block';

    this.lengthInput.style.left = x + 12 + 'px';
    this.lengthInput.style.top = y + 12 + 'px';

    this.angleInput.style.left = x + 92 + 'px';
    this.angleInput.style.top = y + 12 + 'px';
  }

  hide() {
    this.lengthInput.style.display = 'none';
    this.angleInput.style.display = 'none';
  }

  reset() {
    this.manualLength = null;
    this.manualAngle = null;
    this.lengthInput.value = '';
    this.angleInput.value = '';
  }

  switchInput(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.focusedElement = this.focusedElement == 'length' ? 'angle' : 'length';
    this.focus();
  }

  setLength(value: number) {
    this.lengthInput.value = value.toFixed(2) + 'mm';
  }

  setAngle(value: number) {
    this.angleInput.value = value.toFixed(2) + '°';
  }

  focus() {
    if (this.focusedElement == 'length') {
      this.lengthInput.focus();
      this.lengthInput.select();
    } else {
      this.angleInput.focus();
      this.angleInput.select();
    }
  }
}
