import { useState, useEffect } from 'react';
import { PopupMessagingService, SiteInfo } from '../services/PopupMessagingService';

/**
   * Site-specific integration information hook.
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

      const hasAccess = await messagingService.canAccessTab();
      setCanAccessTab(hasAccess);

      if (!hasAccess) {
        setSiteInfo(null);
        return;
      }

      const info = await messagingService.getSiteInfo();
      setSiteInfo(info);
    } catch (err) {
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
