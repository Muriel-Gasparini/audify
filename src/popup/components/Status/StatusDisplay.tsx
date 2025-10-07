import React from 'react';

interface StatusDisplayProps {
  isActive: boolean;
  hasVideo: boolean;
  gain: number;
  isOnNetflix: boolean;
}

/**
 * Componente: StatusDisplay
 * Exibe status atual do normalizador
 */
export function StatusDisplay({ isActive, hasVideo, gain, isOnNetflix }: StatusDisplayProps) {
  const getStatusText = () => {
    if (!isOnNetflix) {
      return '📺 Não está no Netflix';
    }

    if (!hasVideo) {
      return '🔍 Buscando vídeo...';
    }

    if (isActive) {
      return '🎧 Ativo';
    }

    return '⏸️ Inativo';
  };

  const getGainText = () => {
    if (!isOnNetflix || !hasVideo) {
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
