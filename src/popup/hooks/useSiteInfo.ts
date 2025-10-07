import { useState, useEffect } from 'react';
import { PopupMessagingService, SiteInfo } from '../services/PopupMessagingService';

/**
 * Hook: useSiteInfo
 * Obtém informações sobre a integração específica do site atual
 */
export function useSiteInfo(messagingService: PopupMessagingService) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [canAccessTab, setCanAccessTab] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSiteInfo();
  }, []);

  const loadSiteInfo = async () => {
    try {
      setLoading(true);

      // Verifica se pode acessar a aba
      const hasAccess = await messagingService.canAccessTab();
      setCanAccessTab(hasAccess);

      if (!hasAccess) {
        setSiteInfo(null);
        return;
      }

      // Obtém informações sobre integração do site
      const info = await messagingService.getSiteInfo();
      setSiteInfo(info);
    } catch (err) {
      console.error('Error loading site info:', err);
      setSiteInfo(null);
      setCanAccessTab(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    siteInfo,
    canAccessTab,
    loading,
    reloadSiteInfo: loadSiteInfo,
  };
}
