import React from 'react';

interface ToggleButtonProps {
  hasVideo: boolean;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Componente: ToggleButton
 * Botão principal de ação (toggle normalizer)
 */
export function ToggleButton({ hasVideo, isActive, onClick }: ToggleButtonProps) {
  const getButtonText = () => {
    if (!hasVideo) {
      return 'Buscando video...';
    }

    return isActive ? 'Desativar' : 'Ativar';
  };

  const getButtonClass = () => {
    if (!hasVideo) {
      return 'toggle-button disabled';
    }

    return isActive ? 'toggle-button danger' : 'toggle-button primary';
  };

  const isDisabled = !hasVideo;

  return (
    <button className={getButtonClass()} onClick={onClick} disabled={isDisabled}>
      {getButtonText()}
    </button>
  );
}
