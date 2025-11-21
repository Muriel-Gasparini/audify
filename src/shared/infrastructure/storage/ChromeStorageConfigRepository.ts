import { IConfigRepository } from './IConfigRepository';
import { AudioConfig } from '../../../audio-normalization/domain/value-objects/AudioConfig';
import { ILogger } from '../logger/ILogger';
import { AudioLimits } from '../../domain/constants/AudioLimits';
import { ChromeContextUtil } from '../chrome/ChromeContextUtil';

interface StoredConfig {
  targetLevel: number;
  maxGain: number;
  minGain: number;
  isActive: boolean;
}

const DEFAULT_STORED_CONFIG: StoredConfig = {
  targetLevel: AudioLimits.DEFAULT_TARGET_LEVEL,
  maxGain: AudioLimits.DEFAULT_MAX_GAIN,
  minGain: AudioLimits.DEFAULT_MIN_GAIN,
  isActive: false,
};

const STORAGE_KEY = 'normalizerConfig';

export class ChromeStorageConfigRepository implements IConfigRepository {
  private cachedConfig: AudioConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5000;

  constructor(private readonly logger: ILogger) {}

  public async load(): Promise<AudioConfig> {
    if (!this.isExtensionContextValid()) {
      this.logger.warn('Extension context invalid - returning cached/default config');
      this.logger.warn('Extension context invalid at load() entry - using fallback');
      return this.getCachedOrDefaultConfig();
    }

    if (this.cachedConfig && (Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS)) {
      this.logger.debug('Returning cached config (TTL not expired)');
      return this.cachedConfig;
    }

    if (!this.isExtensionContextValid()) {
      this.logger.warn('Extension context invalidated between cache check and chrome call');
      return this.getCachedOrDefaultConfig();
    }

    try {
      const result = await chrome.storage.sync.get([STORAGE_KEY]);
      const storedConfig = result[STORAGE_KEY] as StoredConfig | undefined;

      if (!storedConfig) {
        this.logger.info('No config found in storage, using defaults');
        const defaultConfig = this.createDefaultConfig();
        this.updateCache(defaultConfig);
        return defaultConfig;
      }

      const validatedStored: StoredConfig = {
        targetLevel:
          isFinite(storedConfig.targetLevel) && storedConfig.targetLevel > 0
            ? storedConfig.targetLevel
            : DEFAULT_STORED_CONFIG.targetLevel,
        maxGain:
          isFinite(storedConfig.maxGain) && storedConfig.maxGain > 0
            ? storedConfig.maxGain
            : DEFAULT_STORED_CONFIG.maxGain,
        minGain:
          isFinite(storedConfig.minGain) && storedConfig.minGain > 0
            ? storedConfig.minGain
            : DEFAULT_STORED_CONFIG.minGain,
        isActive:
          typeof storedConfig.isActive === 'boolean'
            ? storedConfig.isActive
            : DEFAULT_STORED_CONFIG.isActive,
      };

      if (validatedStored.minGain > validatedStored.maxGain) {
        this.logger.warn('minGain > maxGain in storage, swapping values');
        [validatedStored.minGain, validatedStored.maxGain] = [validatedStored.maxGain, validatedStored.minGain];
      }

      const config = AudioConfig.fromPrimitives(
        validatedStored.targetLevel,
        validatedStored.maxGain,
        validatedStored.minGain,
        validatedStored.isActive
      );

      this.logger.debug('Config loaded from storage', validatedStored);
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

  public async save(config: AudioConfig): Promise<void> {
    if (!this.isExtensionContextValid()) {
      this.logger.error('Cannot save config - extension context invalidated');
      throw new Error('Extension context invalidated - cannot save config');
    }

    try {
      const storedConfig = config.toPrimitives();
      await chrome.storage.sync.set({ [STORAGE_KEY]: storedConfig });
      this.logger.debug('Config saved to storage', storedConfig);
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

  public async update(partialConfig: Partial<AudioConfig>): Promise<AudioConfig> {
    const currentConfig = await this.load();

    const updatedConfig = new AudioConfig(
      partialConfig.targetLevel ?? currentConfig.targetLevel,
      partialConfig.maxGain ?? currentConfig.maxGain,
      partialConfig.minGain ?? currentConfig.minGain,
      partialConfig.isActive ?? currentConfig.isActive
    );

    await this.save(updatedConfig);
    return updatedConfig;
  }

  private isExtensionContextValid(): boolean {
    return ChromeContextUtil.isExtensionContextValid();
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

  private createDefaultConfig(): AudioConfig {
    return AudioConfig.fromPrimitives(
      DEFAULT_STORED_CONFIG.targetLevel,
      DEFAULT_STORED_CONFIG.maxGain,
      DEFAULT_STORED_CONFIG.minGain,
      DEFAULT_STORED_CONFIG.isActive
    );
  }

  private updateCache(config: AudioConfig): void {
    this.cachedConfig = config;
    this.cacheTimestamp = Date.now();
  }

  private getCachedOrDefaultConfig(): AudioConfig {
    if (this.cachedConfig) {
      this.logger.info('Using cached config (extension context unavailable)');
      return this.cachedConfig;
    }
    this.logger.info('Using default config (no cache available)');
    return this.createDefaultConfig();
  }
}
