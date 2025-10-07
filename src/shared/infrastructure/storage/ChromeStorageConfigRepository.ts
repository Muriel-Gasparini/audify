import { IConfigRepository, NormalizerConfig } from './IConfigRepository';
import { ILogger } from '../logger/ILogger';

/**
 * Configuração padrão do normalizador
 */
const DEFAULT_CONFIG: NormalizerConfig = {
  targetLevel: 0.1,
  maxGain: 8.0,
  minGain: 0.1,
  isActive: false,
};

const STORAGE_KEY = 'normalizerConfig';

/**
 * Implementação de Repository usando chrome.storage.sync
 *
 * Adapter para a Chrome Storage API
 */
export class ChromeStorageConfigRepository implements IConfigRepository {
  constructor(private readonly logger: ILogger) {}

  public async load(): Promise<NormalizerConfig> {
    try {
      const result = await chrome.storage.sync.get([STORAGE_KEY]);
      const storedConfig = result[STORAGE_KEY] as NormalizerConfig | undefined;

      if (!storedConfig) {
        this.logger.info('No config found in storage, using defaults');
        return DEFAULT_CONFIG;
      }

      // Validação e sanitização dos valores carregados
      const config: NormalizerConfig = {
        targetLevel:
          isFinite(storedConfig.targetLevel) && storedConfig.targetLevel > 0
            ? storedConfig.targetLevel
            : DEFAULT_CONFIG.targetLevel,
        maxGain:
          isFinite(storedConfig.maxGain) && storedConfig.maxGain > 0
            ? storedConfig.maxGain
            : DEFAULT_CONFIG.maxGain,
        minGain:
          isFinite(storedConfig.minGain) && storedConfig.minGain > 0
            ? storedConfig.minGain
            : DEFAULT_CONFIG.minGain,
        isActive:
          typeof storedConfig.isActive === 'boolean'
            ? storedConfig.isActive
            : DEFAULT_CONFIG.isActive,
      };

      // Garante que minGain < maxGain
      if (config.minGain > config.maxGain) {
        this.logger.warn('minGain > maxGain in storage, swapping values');
        [config.minGain, config.maxGain] = [config.maxGain, config.minGain];
      }

      this.logger.debug('Config loaded from storage', config);
      return config;
    } catch (error) {
      this.logger.error('Failed to load config from storage', error);
      return DEFAULT_CONFIG;
    }
  }

  public async save(config: NormalizerConfig): Promise<void> {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: config });
      this.logger.debug('Config saved to storage', config);
    } catch (error) {
      this.logger.error('Failed to save config to storage', error);
      throw error;
    }
  }

  public async update(partialConfig: Partial<NormalizerConfig>): Promise<NormalizerConfig> {
    const currentConfig = await this.load();
    const updatedConfig: NormalizerConfig = { ...currentConfig, ...partialConfig };
    await this.save(updatedConfig);
    return updatedConfig;
  }
}
