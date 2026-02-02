import React from 'react';
import './HardModeToggle.css';

interface HardModeToggleProps {
  isHardMode: boolean;
  onToggle: () => void;
  disabled: boolean;
}

export const HardModeToggle: React.FC<HardModeToggleProps> = ({ isHardMode, onToggle, disabled }) => {
  return (
    <div className={`hard-mode-toggle-container ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`hard-mode-button ${isHardMode ? 'on' : 'off'}`}
      >
        Mod Dificil {isHardMode ? 'Activ' : 'Inactiv'}
      </button>
    </div>
  );
};
