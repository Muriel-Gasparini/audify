import { IAudioNormalizationService } from '../ports/IAudioNormalizationService';
import { AudioConfig } from '../../domain/value-objects/AudioConfig';
import { AudioConfigDTO } from '../dto/AudioConfigDTO';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { IConfigRepository } from '../../../shared/infrastructure/storage/IConfigRepository';

export class UpdateAudioConfigUseCase {
  constructor(
    private readonly service: IAudioNormalizationService,
    private readonly repository: IConfigRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(configDTO: Partial<AudioConfigDTO>): Promise<void> {
    const currentConfig = await this.repository.load();
    const currentPrimitives = currentConfig.toPrimitives();

    const updatedConfig = AudioConfig.fromPrimitives(
      configDTO.targetLevel ?? currentPrimitives.targetLevel,
      configDTO.maxGain ?? currentPrimitives.maxGain,
      configDTO.minGain ?? currentPrimitives.minGain,
      configDTO.isActive ?? currentPrimitives.isActive
    );

    await this.repository.save(updatedConfig);

    this.service.updateConfig(updatedConfig);

    this.logger.info('Audio configuration updated via use case', updatedConfig.toPrimitives());
  }
}
