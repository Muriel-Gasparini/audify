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
      console.error('[Audify] Failed to load audio state:', err);
      if (state === null) {
        setState({
          gain: 1.0,
          volume: 1.0,
          isActive: false,
          hasVideo: false,
        });
      }
    }
  };

  return {
    state,
    reloadState: loadState,
  };
}
