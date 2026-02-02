import React, { useState } from 'react';
import './HelpTooltip.css';

interface HelpTooltipProps {
  text: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div className="tooltip-icon">?</div>
      {visible && (
        <div className="tooltip-box">
          {text}
        </div>
      )}
    </div>
  );
};
