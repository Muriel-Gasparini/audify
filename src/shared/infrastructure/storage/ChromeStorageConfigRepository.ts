import { IConfigRepository, NormalizerConfig } from './IConfigRepository';
import { ILogger } from '../logger/ILogger';

/**
   * Default normalizer configuration.
   */
const DEFAULT_CONFIG: NormalizerConfig = {
  targetLevel: 0.1,
  maxGain: 8.0,
  minGain: 0.1,
  isActive: false,
};

const STORAGE_KEY = 'normalizerConfig';

/**
   * Implementation of Repository using chrome.
   */
export class ChromeStorageConfigRepository implements IConfigRepository {
  private cachedConfig: NormalizerConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5000;

  constructor(private readonly logger: ILogger) {}

  public async load(): Promise<NormalizerConfig> {
    if (!this.isExtensionContextValid()) {
      console.warn('[ConfigRepository] Extension context invalid - returning cached/default config');
      this.logger.warn('Extension context invalid at load() entry - using fallback');
      return this.getCachedOrDefaultConfig();
    }

    if (this.cachedConfig && (Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS)) {
      this.logger.debug('Returning cached config (TTL not expired)');
      return this.cachedConfig;
    }

    if (!this.isExtensionContextValid()) {
      console.warn('[ConfigRepository] Extension context invalidated between cache check and chrome call');
      return this.getCachedOrDefaultConfig();
    }

    try {
      const result = await chrome.storage.sync.get([STORAGE_KEY]);
      const storedConfig = result[STORAGE_KEY] as NormalizerConfig | undefined;

      if (!storedConfig) {
        this.logger.info('No config found in storage, using defaults');
        this.updateCache(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }

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

      if (config.minGain > config.maxGain) {
        this.logger.warn('minGain > maxGain in storage, swapping values');
        [config.minGain, config.maxGain] = [config.maxGain, config.minGain];
      }

      this.logger.debug('Config loaded from storage', config);
      this.updateCache(config);
      return config;
    } catch (error) {
      if (this.isContextInvalidatedError(error)) {
        this.logger.error('Extension context invalidated during config load', error);
        return this.getCachedOrDefaultConfig();
      }

      this.logger.error('Failed to load config from storage', error);
      return this.getCachedOrDefaultConfig();
    }
  }

  public async save(config: NormalizerConfig): Promise<void> {
    if (!this.isExtensionContextValid()) {
      this.logger.error('Cannot save config - extension context invalidated');
      throw new Error('Extension context invalidated - cannot save config');
    }

    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: config });
      this.logger.debug('Config saved to storage', config);
      this.updateCache(config);
    } catch (error) {
      if (this.isContextInvalidatedError(error)) {
        this.logger.error('Extension context invalidated during config save', error);
        throw new Error('Extension context invalidated - cannot save config');
      }

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

  /**
   * Check if extension context is valid.
   */
  private isExtensionContextValid(): boolean {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  /**
   * Detect if error is due to extension context invalidation.
   */
  private isContextInvalidatedError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('Extension context invalidated') ||
      message.includes('cannot access chrome') ||
      message.includes('Extension context')
    );
  }

  /**
   * Update in-memory cache.
   */
  private updateCache(config: NormalizerConfig): void {
    this.cachedConfig = config;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Get cached config or fall back to default.
   */
  private getCachedOrDefaultConfig(): NormalizerConfig {
    if (this.cachedConfig) {
      this.logger.info('Using cached config (extension context unavailable)');
      return this.cachedConfig;
    }
    this.logger.info('Using default config (no cache available)');
    return DEFAULT_CONFIG;
  }
}
