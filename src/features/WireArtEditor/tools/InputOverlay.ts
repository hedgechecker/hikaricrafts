import { parseMathInput } from '../utils/math';
/**
 * Handles Display and Input of Line length and angle
 */
export class InputOverlay {
  private Input1: HTMLInputElement;
  private Input2: HTMLInputElement;
  private onChange: () => void;
  private focusedElement: 1 | 2 = 1;

  InputVal1: number | null | undefined = null;
  InputVal2: number | null | undefined = null;
  unit1: string;
  unit2: string;

  constructor(
    parent: HTMLElement,
    unit1: string,
    unit2: string,
    onChange: () => void,
  ) {
    this.onChange = onChange;
    this.Input1 = this.createInput();
    this.Input2 = this.createInput();
    this.unit1 = unit1;
    this.unit2 = unit2;

    parent.appendChild(this.Input1);
    parent.appendChild(this.Input2);

    this.Input1.addEventListener("input", this.handleInput1);
    this.Input2.addEventListener("input", this.handleInput2);

    this.Input1.addEventListener("focus", () => {
      this.focusedElement = 1;
    });
    this.Input2.addEventListener("focus", () => {
      this.focusedElement = 2;
    });
    window.addEventListener("keydown", this.onKeyDown);
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement("input");

    input.type = "text";
    input.style.position = "absolute";
    input.style.pointerEvents = "auto";
    input.style.width = "70px";
    input.style.display = "none";
    input.style.backgroundColor = "var(--color-background)";
    input.style.color = "var(--color-text-primary)";
    input.style.border = "var(--space-border) solid var(--color-border)";
    input.style.outline = "none";
    input.style.borderRadius = "var(--space-xxs)";

    return input;
  }

  private handleInput1 = () => {
    const value = parseMathInput(this.Input1.value);
    this.InputVal1 = value ?? undefined;
    //if (this.InputVal1) this.InputVal1 /= 10;
    this.onChange();
  };

  private handleInput2 = () => {
    const value = parseMathInput(this.Input2.value);
    this.InputVal2 = value ?? undefined;
    this.onChange();
  };

  show(x: number, y: number) {
    this.Input1.style.display = "block";
    this.Input2.style.display = "block";

    this.Input1.style.left = x + 12 + "px";
    this.Input1.style.top = y + 12 + "px";

    this.Input2.style.left = x + 92 + "px";
    this.Input2.style.top = y + 12 + "px";
  }

  hide() {
    this.Input1.style.display = "none";
    this.Input2.style.display = "none";
  }

  reset() {
    this.InputVal1 = null;
    this.InputVal2 = null;
    this.Input1.value = "";
    this.Input2.value = "";
  }

  switchInput(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.focusedElement = this.focusedElement == 1 ? 2 : 1;
    this.focus();
  }

  setValue1(value: number) {
    this.Input1.value = value.toFixed(2) + this.unit1;
  }

  setValue2(value: number) {
    this.Input2.value = value.toFixed(2) + this.unit2;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") this.switchInput(event);
  };

  focus() {
    if (this.focusedElement == 1) {
      this.Input1.focus();
      this.Input1.select();
      this.Input1.style.borderColor = "var(--color-accent)";
      this.Input2.style.borderColor = "var(--color-border)";
    } else {
      this.Input2.focus();
      this.Input2.select();
      this.Input2.style.borderColor = "var(--color-accent)";
      this.Input1.style.borderColor = "var(--color-border)";
    }
  }
}
