import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export type ActivationResult =
  | { success: true }
  | { success: false; reason: 'NO_VIDEO' | 'ALREADY_ACTIVE' };

/**
   * Activates audio normalizer with validation.
   * @returns {ActivationResult} Operation result with success status or failure reason
   */
export class ActivateNormalizerUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
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
