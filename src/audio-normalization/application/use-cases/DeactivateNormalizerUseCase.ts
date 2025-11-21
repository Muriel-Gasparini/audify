import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
   * Deactivates audio normalizer.
   */
export class DeactivateNormalizerUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  public execute(): void {
    this.service.deactivate();
    this.logger.info('Normalizer deactivated via use case');
  }
}
