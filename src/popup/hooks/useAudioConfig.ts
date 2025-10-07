import { useState, useEffect } from 'react';
import { PopupMessagingService, AudioConfig } from '../services/PopupMessagingService';

/**
 * Hook: useAudioConfig
 * Gerencia estado e operações da configuração de áudio
 */
export function useAudioConfig(messagingService: PopupMessagingService) {
  const [config, setConfig] = useState<AudioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega configuração inicial
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedConfig = await messagingService.getConfig();
      setConfig(loadedConfig);
    } catch (err) {
      setError('Erro ao carregar configuração');
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTargetLevel = async (value: number) => {
    try {
      await messagingService.updateConfig({ targetLevel: value });
      setConfig((prev) => (prev ? { ...prev, targetLevel: value } : null));
    } catch (err) {
      setError('Erro ao atualizar target level');
      console.error('Error updating target level:', err);
    }
  };

  const updateMaxGain = async (value: number) => {
    try {
      await messagingService.updateConfig({ maxGain: value });
      setConfig((prev) => (prev ? { ...prev, maxGain: value } : null));
    } catch (err) {
      setError('Erro ao atualizar max gain');
      console.error('Error updating max gain:', err);
    }
  };

  const updateMinGain = async (value: number) => {
    try {
      await messagingService.updateConfig({ minGain: value });
      setConfig((prev) => (prev ? { ...prev, minGain: value } : null));
    } catch (err) {
      setError('Erro ao atualizar min gain');
      console.error('Error updating min gain:', err);
    }
  };

  return {
    config,
    loading,
    error,
    updateTargetLevel,
    updateMaxGain,
    updateMinGain,
    reloadConfig: loadConfig,
  };
}
