import { IAudioNormalizationService } from '../ports/IAudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export class DeactivateNormalizerUseCase {
  constructor(
    private readonly service: IAudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  public execute(): void {
    this.service.deactivate();
    this.logger.info('Normalizer deactivated via use case');
  }
}
