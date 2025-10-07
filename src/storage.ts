import { NormalizerConfig, STORAGE_KEYS, DEFAULT_CONFIG } from './types';

// ============================================================================
// Storage Helpers
// ============================================================================

export async function saveConfig(config: NormalizerConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: config }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function loadConfig(): Promise<NormalizerConfig> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([STORAGE_KEYS.CONFIG], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const storedConfig = result[STORAGE_KEYS.CONFIG] as NormalizerConfig | undefined;

        if (!storedConfig) {
          resolve(DEFAULT_CONFIG);
          return;
        }

        // Validação e sanitização dos valores carregados
        const config: NormalizerConfig = {
          targetLevel: isFinite(storedConfig.targetLevel) && storedConfig.targetLevel > 0
            ? storedConfig.targetLevel
            : DEFAULT_CONFIG.targetLevel,
          maxGain: isFinite(storedConfig.maxGain) && storedConfig.maxGain > 0
            ? storedConfig.maxGain
            : DEFAULT_CONFIG.maxGain,
          minGain: isFinite(storedConfig.minGain) && storedConfig.minGain > 0
            ? storedConfig.minGain
            : DEFAULT_CONFIG.minGain,
          isActive: typeof storedConfig.isActive === 'boolean'
            ? storedConfig.isActive
            : DEFAULT_CONFIG.isActive,
        };

        // Garante que minGain < maxGain
        if (config.minGain > config.maxGain) {
          [config.minGain, config.maxGain] = [config.maxGain, config.minGain];
        }

        resolve(config);
      }
    });
  });
}

export async function updateConfig(
  partialConfig: Partial<NormalizerConfig>
): Promise<NormalizerConfig> {
  const currentConfig = await loadConfig();
  const updatedConfig: NormalizerConfig = { ...currentConfig, ...partialConfig };
  await saveConfig(updatedConfig);
  return updatedConfig;
}
