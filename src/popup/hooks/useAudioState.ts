import { useState, useEffect, useRef } from 'react';
import { PopupMessagingService, AudioState } from '../services/PopupMessagingService';

/**
   * Real-time normalizer state management hook with polling.
   */
export function useAudioState(
  messagingService: PopupMessagingService,
  isActive: boolean,
  pollingInterval: number = 500
) {
  const [state, setState] = useState<AudioState | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadState();

    intervalRef.current = window.setInterval(() => {
      loadState();
    }, pollingInterval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollingInterval]);

  const loadState = async () => {
    try {
      const loadedState = await messagingService.getState();
      setState(loadedState);
    } catch (err) {
    }
  };

  return {
    state,
    reloadState: loadState,
  };
}
