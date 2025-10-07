import React from 'react';

interface ToggleButtonProps {
  isOnNetflix: boolean;
  hasVideo: boolean;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Componente: ToggleButton
 * Botão principal de ação (toggle normalizer ou ir para Netflix)
 */
export function ToggleButton({ isOnNetflix, hasVideo, isActive, onClick }: ToggleButtonProps) {
  const getButtonText = () => {
    if (!isOnNetflix) {
      return 'Ir para Netflix';
    }

    if (!hasVideo) {
      return 'Buscando vídeo...';
    }

    return isActive ? 'Desativar' : 'Ativar';
  };

  const getButtonClass = () => {
    if (!isOnNetflix) {
      return 'toggle-button primary';
    }

    if (!hasVideo) {
      return 'toggle-button disabled';
    }

    return isActive ? 'toggle-button danger' : 'toggle-button primary';
  };

  const isDisabled = isOnNetflix && !hasVideo;

  return (
    <button className={getButtonClass()} onClick={onClick} disabled={isDisabled}>
      {getButtonText()}
    </button>
  );
}
