import { useState, type ReactNode, useEffect } from "react";
import { Dialog, type DialogType } from "./Dialog";
import { logError } from "../../utils/error/errorHandler";

/* -------------------- TYPES -------------------- */

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

/* -------------------- GLOBAL REF -------------------- */

let showDialogRef: ShowDialogFn | null = null;

export function showDialog(options: ShowDialogOptions) {
  if (!showDialogRef) {
    logError("uninitialized", {
      function: "showDialog",
    });
    return;
  }
  return showDialogRef(options);
}

/* -------------------- HOOK -------------------- */

export function useDialog() {
  const [state, setState] = useState<{
    type: DialogType;
    message: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    doImage?: string;
    dontImage?: string;
    resolve: (value: boolean | string) => void;
  } | null>(null);

  const showDialogInternal: ShowDialogFn = (options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  };

  const handleClose = (result: boolean | string) => {
    if (state) {
      state.resolve(result);
      setState(null);
    }
  };

  // Register globally so external calls can use showDialog()
  useEffect(() => {
    showDialogRef = showDialogInternal;

    return () => {
      showDialogRef = null;
    };
  }, []);

  const dialogComponent: ReactNode = state ? (
    <Dialog
      type={state.type}
      message={state.message}
      defaultValue={state.defaultValue}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      doImage={state.doImage}
      dontImage={state.dontImage}
      onClose={handleClose}
    />
  ) : null;

  return { dialogComponent };
}
