import React from 'react';

interface StatusDisplayProps {
  isActive: boolean;
  hasVideo: boolean;
  gain: number;
}

export function StatusDisplay({ isActive, hasVideo, gain }: StatusDisplayProps) {
  const getStatusText = () => {
    if (!hasVideo) {
      return 'Looking for video...';
    }

    if (isActive) {
      return 'Active';
    }

    return 'Inactive';
  };

  const getGainText = () => {
    if (!hasVideo) {
      return 'Gain: --';
    }

    return `Gain: ${gain.toFixed(2)}x`;
  };

  return (
    <div className="status-display">
      <div className="status-text">{getStatusText()}</div>
      <div className="gain-text">{getGainText()}</div>
    </div>
  );
}
