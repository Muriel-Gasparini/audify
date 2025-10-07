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

    // SEMPRE faz polling, não apenas quando ativo
    // Isso garante que o UI atualize quando:
    // 1. Vídeo é descoberto após o popup abrir
    // 2. Normalizer é ativado automaticamente quando vídeo é encontrado
    // 3. Estado muda por qualquer motivo externo
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
      console.log('[useAudioState] Loaded state from content script:', loadedState);
      setState(loadedState);
    } catch (err) {
      // Ignora erros silenciosamente no polling
      // Mantém o estado anterior se houver erro
      console.debug('[useAudioState] Error loading state:', err);
    }
  };

  return {
    state,
    reloadState: loadState,
  };
}
