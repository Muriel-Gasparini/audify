import { WebAudioAdapter } from '../web-audio/WebAudioAdapter';
import { AudioProcessor } from '../../domain/entities/AudioProcessor';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { AudioProcessingConstants } from '../../domain/constants/AudioProcessingConstants';

export class NormalizationLoop {
  private animationFrameId: number | null = null;
  private lastNormalizationTime: number = 0;
  private isRunning: boolean = false;

  constructor(
    private readonly adapter: WebAudioAdapter,
    private readonly processor: AudioProcessor,
    private readonly logger: ILogger
  ) {}

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.normalize();
  }

  public stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  private normalize = (): void => {
    if (!this.isRunning) {
      return;
    }

    if (!this.adapter.isInitialized()) {
      this.animationFrameId = requestAnimationFrame(this.normalize);
      return;
    }

    const now = performance.now();
    const timeSinceLastUpdate = now - this.lastNormalizationTime;

    if (timeSinceLastUpdate >= AudioProcessingConstants.NORMALIZATION_INTERVAL_MS) {
      try {
        const metrics = this.adapter.getMetrics();
        const nextGain = this.processor.calculateNextGain(metrics);
        this.adapter.setGainSmooth(nextGain, AudioProcessingConstants.GAIN_SMOOTHING_NORMAL);
        this.lastNormalizationTime = now;
      } catch (error) {
        this.logger.error('Error in normalization loop', error);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.normalize);
  };
}
