import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { AudioConfig } from '../../domain/value-objects/AudioConfig';
import { AudioConfigDTO } from '../dto/AudioConfigDTO';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { IConfigRepository } from '../../../shared/infrastructure/storage/IConfigRepository';

/**
   * Updates audio configuration.
   */
export class UpdateAudioConfigUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly repository: IConfigRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(configDTO: Partial<AudioConfigDTO>): Promise<void> {
    const currentConfig = await this.repository.load();

    const updatedPrimitives = {
      targetLevel: configDTO.targetLevel ?? currentConfig.targetLevel,
      maxGain: configDTO.maxGain ?? currentConfig.maxGain,
      minGain: configDTO.minGain ?? currentConfig.minGain,
    };

    const audioConfig = AudioConfig.fromPrimitives(
      updatedPrimitives.targetLevel,
      updatedPrimitives.maxGain,
      updatedPrimitives.minGain
    );

    await this.repository.update(updatedPrimitives);

    this.service.updateConfig(audioConfig);

    this.logger.info('Audio configuration updated via use case', updatedPrimitives);
  }
}
