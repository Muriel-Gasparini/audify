import { useState, useEffect } from 'react';
import { PopupMessagingService } from '../services/PopupMessagingService';

/**
 * Hook: useNetflixDetection
 * Detecta se a aba ativa está no Netflix
 */
export function useNetflixDetection(messagingService: PopupMessagingService) {
  const [isOnNetflix, setIsOnNetflix] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNetflix();
  }, []);

  const checkNetflix = async () => {
    try {
      setLoading(true);
      const onNetflix = await messagingService.isOnNetflix();
      setIsOnNetflix(onNetflix);
    } catch (err) {
      console.error('Error checking Netflix:', err);
      setIsOnNetflix(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isOnNetflix,
    loading,
    recheckNetflix: checkNetflix,
  };
}
