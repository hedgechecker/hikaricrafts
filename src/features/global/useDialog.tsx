import { useState, type ReactNode } from 'react';
import { Dialog, type DialogType } from './Dialog';

export function useDialog() {
  const [state, setState] = useState<{
    type: DialogType;
    message: string;
    defaultValue?: string;
    resolve: (value: boolean | string) => void;
  } | null>(null);

  const showDialog = (options: {
    type: DialogType;
    message: string;
    defaultValue?: string;
  }): Promise<boolean | string> => {
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

  const dialogComponent: ReactNode = state ? (
    <Dialog
      type={state.type}
      message={state.message}
      defaultValue={state.defaultValue}
      onClose={handleClose}
    />
  ) : null;

  return { showDialog, dialogComponent };
}
