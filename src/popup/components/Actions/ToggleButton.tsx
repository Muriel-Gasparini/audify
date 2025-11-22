interface ToggleButtonProps {
  hasVideo: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ToggleButton({ hasVideo, isActive, onClick }: ToggleButtonProps) {
  const getButtonText = () => {
    if (!hasVideo) {
      return 'Looking for video...';
    }

    return isActive ? 'Deactivate' : 'Activate';
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
