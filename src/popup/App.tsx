import React from 'react';
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

/**
 * Componente: App
 * Componente raiz da aplicação
 */
export function App() {
  const { messagingService } = useExtension();

  // Hooks
  const { siteInfo, canAccessTab, loading: siteInfoLoading } = useSiteInfo(messagingService);
  const { config, loading: configLoading, updateTargetLevel, updateMaxGain, updateMinGain } =
    useAudioConfig(messagingService);
  const { state } = useAudioState(messagingService, config?.isActive ?? false);

  // Loading state
  if (siteInfoLoading || configLoading || !config) {
    return (
      <div className="container">
        <Header />
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  // Se não pode acessar a aba (chrome://, edge://, etc.)
  if (!canAccessTab) {
    return (
      <div className="container">
        <Header />
        <div className="error">Esta extensão não funciona em páginas do navegador.</div>
      </div>
    );
  }

  const hasVideo = state?.hasVideo ?? false;
  const isActive = config.isActive;
  const gain = state?.gain ?? 1.0;

  const handleToggleClick = async () => {
    if (hasVideo) {
      await messagingService.toggleNormalizer();
      // Força reload da página para atualizar UI
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
