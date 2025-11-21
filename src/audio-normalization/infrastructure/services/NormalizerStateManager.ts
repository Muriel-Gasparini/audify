import { WebAudioAdapter } from '../web-audio/WebAudioAdapter';
import { NormalizationLoop } from './NormalizationLoop';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export class NormalizerStateManager {
  private isActive: boolean;

  constructor(
    private readonly adapter: WebAudioAdapter,
    private readonly normalizationLoop: NormalizationLoop,
    private readonly logger: ILogger,
    initialIsActive: boolean = false
  ) {
    this.isActive = initialIsActive;
  }

  public activate(): void {
    if (this.isActive) {
      this.logger.info('Normalizer already active');
      return;
    }

    this.isActive = true;

    if (this.adapter.isInitialized()) {
      this.logger.debug('activate() - Switching from BYPASS to ACTIVE mode');
      this.adapter.setActive(true);
      this.adapter.resume();

      this.normalizationLoop.start();
    }

    this.logger.info('Normalizer activated');
  }

  public deactivate(): void {
    if (!this.isActive) {
      this.logger.info('Normalizer already inactive');
      return;
    }

    this.isActive = false;

    this.normalizationLoop.stop();

    if (this.adapter.isInitialized()) {
      this.logger.debug('deactivate() - Switching from ACTIVE to BYPASS mode (audio preserved)');
      this.adapter.setActive(false);
    }

    this.logger.info('Normalizer deactivated');
  }

  public isNormalizerActive(): boolean {
    return this.isActive;
  }

  public startLoopIfActive(): void {
    if (this.isActive) {
      this.logger.debug('Starting normalization loop (normalizer is active)');
      this.normalizationLoop.start();
    }
  }
}
