import { IAudioNormalizationService } from '../ports/IAudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export type ActivationResult =
  | { success: true }
  | { success: false; reason: 'NO_VIDEO' | 'ALREADY_ACTIVE' };

export class ActivateNormalizerUseCase {
  constructor(
    private readonly service: IAudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  public execute(): ActivationResult {
    if (!this.service.hasVideoAttached()) {
      this.logger.info('Cannot activate normalizer: no video attached (will activate when video is discovered)');
      return { success: false, reason: 'NO_VIDEO' };
    }

    if (this.service.isNormalizerActive()) {
      this.logger.info('Normalizer already active');
      return { success: false, reason: 'ALREADY_ACTIVE' };
    }

    this.service.activate();
    this.logger.info('Normalizer activated via use case');
    return { success: true };
  }
}
