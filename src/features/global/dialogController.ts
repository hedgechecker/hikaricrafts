import { logError } from "../../utils/error/errorHandler";
import type { DialogType } from "./Dialog";

type ShowDialogOptions = {
  type: DialogType;
  message: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  doImage?: string;
  dontImage?: string;
};

type ShowDialogFn = (options: ShowDialogOptions) => Promise<boolean | string>;

let showDialogRef: ShowDialogFn | null = null;

export function registerDialog(fn: ShowDialogFn) {
  showDialogRef = fn;
}

export function showDialog(options: ShowDialogOptions) {
  if (!showDialogRef) {
    logError("uninitialzed", {
      function: "showDialog",
    });
    return;
  }
  return showDialogRef(options);
}
