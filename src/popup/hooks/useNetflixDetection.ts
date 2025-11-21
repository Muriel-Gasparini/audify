import { useState, useEffect } from 'react';
import { PopupMessagingService } from '../services/PopupMessagingService';

/**
   * Detects if active tab is accessible to extension.
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
