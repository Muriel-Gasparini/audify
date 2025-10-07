import React from 'react';

interface StatusDisplayProps {
  isActive: boolean;
  hasVideo: boolean;
  gain: number;
}

/**
 * Componente: StatusDisplay
 * Exibe status atual do normalizador
 */
export function StatusDisplay({ isActive, hasVideo, gain }: StatusDisplayProps) {
  const getStatusText = () => {
    if (!hasVideo) {
      return 'Buscando video...';
    }

    if (isActive) {
      return 'Ativo';
    }

    return 'Inativo';
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
