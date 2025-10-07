import { useState, useEffect, useRef } from 'react';
import { PopupMessagingService, AudioState } from '../services/PopupMessagingService';

/**
 * Hook: useAudioState
 * Gerencia estado em tempo real do normalizador (gain, volume, etc.)
 */
export function useAudioState(
  messagingService: PopupMessagingService,
  isActive: boolean,
  pollingInterval: number = 500
) {
  const [state, setState] = useState<AudioState | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Carrega estado inicial
    loadState();

    // Se ativo, faz polling para atualizar gain
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        loadState();
      }, pollingInterval);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, pollingInterval]);

  const loadState = async () => {
    try {
      const loadedState = await messagingService.getState();
      setState(loadedState);
    } catch (err) {
      // Ignora erros silenciosamente no polling
      // Mantém o estado anterior se houver erro
      console.debug('Error loading state:', err);
    }
  };

  return {
    state,
    reloadState: loadState,
  };
}
