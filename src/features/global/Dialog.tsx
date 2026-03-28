import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from "./styles/Dialog.module.css";


export type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogProps {
  type: DialogType;
  message: string;
  defaultValue?: string;
  onClose: (result: boolean | string) => void;
}

export const Dialog: React.FC<DialogProps> = ({ type, message, defaultValue = '', onClose }) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(type === 'prompt' ? '' : false);
      if (e.key === 'Enter') {
        onClose(type === 'prompt' ? inputValue : true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        onClose(type === 'prompt' ? inputValue : true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [inputValue, onClose, type]);

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.wrapper}>
        <p>{message}</p>
        {type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={styles.input}
            autoFocus
          />
        )}
        <div className={styles.buttonContainer}>
          {(type === 'confirm' || type === 'prompt') && (
            <button
              className={styles.cancelButton}
              onClick={() => onClose(type === 'prompt' ? '' : false)}
            >
              Abbrechen
            </button>
          )}
          <button
            className={styles.confirmButton}
            onClick={() => onClose(type === 'prompt' ? inputValue : true)}
          >
            {type === 'alert' ? 'OK' : 'OK'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
