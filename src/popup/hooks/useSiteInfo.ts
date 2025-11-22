import { useState, useEffect } from 'react';
import { PopupMessagingService, SiteInfo } from '../services/PopupMessagingService';

/**
   * Site-specific integration information hook.
   */
export function useSiteInfo(messagingService: PopupMessagingService) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [canAccessTab, setCanAccessTab] = useState(true);
  const [loading, setLoading] = useState(true);
  const [needsReload, setNeedsReload] = useState(false);

  useEffect(() => {
    loadSiteInfo();
  }, []);

  const loadSiteInfo = async () => {
    try {
      setLoading(true);
      setNeedsReload(false);

      const hasAccess = await messagingService.canAccessTab();
      setCanAccessTab(hasAccess);

      if (!hasAccess) {
        setSiteInfo(null);
        return;
      }

      const info = await messagingService.getSiteInfo();
      setSiteInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Content script')) {
        setNeedsReload(true);
      }
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
    needsReload,
    reloadSiteInfo: loadSiteInfo,
  };
}
