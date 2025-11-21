/**
   * Normalizer configuration model.
   */
export interface NormalizerConfig {
  targetLevel: number;
  maxGain: number;
  minGain: number;
  isActive: boolean;
}

/**
   * Configuration repository port.
   */
export interface IConfigRepository {
  load(): Promise<NormalizerConfig>;

  save(config: NormalizerConfig): Promise<void>;

  update(partialConfig: Partial<NormalizerConfig>): Promise<NormalizerConfig>;
}
