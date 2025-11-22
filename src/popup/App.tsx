import { useExtension } from './contexts/ExtensionContext';
import { useAudioConfig } from './hooks/useAudioConfig';
import { useAudioState } from './hooks/useAudioState';
import { useSiteInfo } from './hooks/useSiteInfo';
import { Header } from './components/Header/Header';
import { StatusDisplay } from './components/Status/StatusDisplay';
import { TargetLevelControl } from './components/Controls/TargetLevelControl';
import { MaxGainControl } from './components/Controls/MaxGainControl';
import { MinGainControl } from './components/Controls/MinGainControl';
import { ToggleButton } from './components/Actions/ToggleButton';
import { Footer } from './components/Footer/Footer';

export function App() {
  const { messagingService } = useExtension();
  const { siteInfo, canAccessTab, loading: siteInfoLoading, needsReload } = useSiteInfo(messagingService);
  const { config, loading: configLoading, updateTargetLevel, updateMaxGain, updateMinGain } =
    useAudioConfig(messagingService);
  const { state } = useAudioState(messagingService, config?.isActive ?? false);

  if (siteInfoLoading || configLoading || !config) {
    return (
      <div className="container">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (needsReload) {
    const handleReload = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
          window.close();
        }
      });
    };

    return (
      <div className="container">
        <Header />
        <div className="reload-required">
          <p className="reload-message">Reload the page to activate the extension</p>
          <button className="reload-button" onClick={handleReload}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessTab) {
    return (
      <div className="container">
        <Header />
        <div className="error">This extension does not work on browser pages.</div>
      </div>
    );
  }

  const hasVideo = state?.hasVideo ?? false;
  const isActive = config.isActive;
  const gain = state?.gain ?? 1.0;

  const handleToggleClick = async () => {
    if (hasVideo) {
      await messagingService.toggleNormalizer();
      window.location.reload();
    }
  };

  const controlsDisabled = !hasVideo;

  return (
    <div className="container">
      <Header integrationName={siteInfo?.integrationName} />

      <StatusDisplay isActive={isActive} hasVideo={hasVideo} gain={gain} />

      <div className="controls">
        <TargetLevelControl
          value={config.targetLevel}
          onChange={updateTargetLevel}
          disabled={controlsDisabled}
        />

        <MaxGainControl value={config.maxGain} onChange={updateMaxGain} disabled={controlsDisabled} />

        <MinGainControl value={config.minGain} onChange={updateMinGain} disabled={controlsDisabled} />
      </div>

      <ToggleButton
        hasVideo={hasVideo}
        isActive={isActive}
        onClick={handleToggleClick}
      />

      <Footer />
    </div>
  );
}
