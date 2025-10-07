import { useState, useEffect } from 'react';
import { PopupMessagingService } from '../services/PopupMessagingService';

/**
 * Hook: useNetflixDetection
 * Detecta se a aba ativa está acessível para a extensão
 */
export function useNetflixDetection(messagingService: PopupMessagingService) {
  const [isOnNetflix, setIsOnNetflix] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTabAccess();
  }, []);

  const checkTabAccess = async () => {
    try {
      setLoading(true);
      const hasAccess = await messagingService.canAccessTab();
      setIsOnNetflix(hasAccess);
    } catch (err) {
      console.error('Error checking tab access:', err);
      setIsOnNetflix(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isOnNetflix,
    loading,
    recheckNetflix: checkTabAccess,
  };
}
