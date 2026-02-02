import React from 'react';
import './HardModeInfoModal.css';

interface HardModeInfoModalProps {
  onClose: () => void;
}

// A mini-component for the visual examples
const MiniGrid = ({ letters, states }: { letters: string; states: string[] }) => (
  <div className="mini-grid">
    {letters.split('').map((letter, i) => (
      <div key={i} className={`mini-cell mini-cell-${states[i]}`}>
        {letter}
      </div>
    ))}
  </div>
);

export const HardModeInfoModal: React.FC<HardModeInfoModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop-info" onClick={onClose}>
      <div className="modal-content-info" onClick={(e) => e.stopPropagation()}>
        <button className="close-button-info" onClick={onClose}>&times;</button>
        <h2>Modul Dificil (Hard Mode)</h2>
        <p>
          Când Modul Dificil este activat, trebuie să respecți reguli suplimentare la următoarele încercări.
        </p>

        <div className="rule-section">
          <h3>1. Literele Verzi trebuie refolosite</h3>
          <p>Orice literă care este în poziția corectă (verde) trebuie să rămână în aceeași poziție la următoarea încercare.</p>
          <div className="visual-example">
            <span>Dacă ai ghicit:</span>
            <MiniGrid letters="MARTE" states={['correct', 'correct', 'absent', 'absent', 'absent']} />
            <span>Următoarea încercare <strong>trebuie</strong> să înceapă cu "MA":</span>
            <MiniGrid letters="MARAR" states={['correct', 'correct', 'empty', 'empty', 'empty']} />
          </div>
        </div>

        <div className="rule-section">
          <h3>2. Literele Galbene trebuie incluse</h3>
          <p>Orice literă care este în cuvânt, dar pe o poziție greșită (galben), trebuie inclusă în următoarea încercare.</p>
           <div className="visual-example">
            <span>Dacă ai ghicit:</span>
            <MiniGrid letters="PERLA" states={['absent', 'present', 'absent', 'present', 'absent']} />
            <span>Următoarea încercare <strong>trebuie</strong> să conțină literele "E" și "L":</span>
            <MiniGrid letters="LEGAN" states={['present', 'present', 'empty', 'empty', 'empty']} />
          </div>
        </div>

        <div className="screenshot-placeholder">
          {/* 
            As an AI, I cannot take a real-time screenshot of the game. 
            This is a placeholder where a real screenshot would go.
          */}
          <img 
            src="https://via.placeholder.com/400x200.png?text=Exemplu+Screenshot+Joc" 
            alt="Screenshot of a game in Hard Mode" 
          />
        </div>

        <button className="confirm-button-info" onClick={onClose}>Am înțeles</button>
      </div>
    </div>
  );
};
