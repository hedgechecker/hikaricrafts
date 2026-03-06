import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogProps {
  type: DialogType;
  message: string;
  defaultValue?: string; // for prompt
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
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <p>{message}</p>
        {type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        )}
        <div style={buttonContainerStyle}>
          {(type === 'confirm' || type === 'prompt') && (
            <button
              style={cancelButtonStyle}
              onClick={() => onClose(type === 'prompt' ? '' : false)}
            >
              Abbrechen
            </button>
          )}
          <button
            style={confirmButtonStyle}
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

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const boxStyle: React.CSSProperties = {
  background: '#fff',
  padding: '20px 30px',
  borderRadius: '8px',
  minWidth: '300px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '20px',
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '6px 20px',
  fontSize: '14px',
  cursor: 'pointer',
  border: 'none',
  background: '#28a745',
  color: 'white',
  borderRadius: '4px',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '6px 20px',
  fontSize: '14px',
  cursor: 'pointer',
  border: 'none',
  background: '#dc3545',
  color: 'white',
  borderRadius: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: '14px',
  marginTop: '10px',
};
