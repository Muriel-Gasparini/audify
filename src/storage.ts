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
        const config = result[STORAGE_KEYS.CONFIG] as NormalizerConfig | undefined;
        resolve(config ?? DEFAULT_CONFIG);
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
