import { IAudioNormalizationService } from '../../application/ports/IAudioNormalizationService';
import { AudioConfig } from '../../domain/value-objects/AudioConfig';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { WebAudioAdapter } from '../web-audio/WebAudioAdapter';
import { AudioProcessor } from '../../domain/entities/AudioProcessor';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { VideoAttachmentManager } from './VideoAttachmentManager';
import { NormalizationLoop } from './NormalizationLoop';
import { NormalizerStateManager } from './NormalizerStateManager';
import { EventPublisherService } from './EventPublisherService';
import { VideoLifecycleObserver } from './VideoLifecycleObserver';
import { AudioProcessingConstants } from '../../domain/constants/AudioProcessingConstants';

export class AudioNormalizationFacade implements IAudioNormalizationService {
  private readonly processor: AudioProcessor;
  private readonly adapter: WebAudioAdapter;
  private readonly lifecycleObserver: VideoLifecycleObserver;
  private readonly attachmentManager: VideoAttachmentManager;
  private readonly normalizationLoop: NormalizationLoop;
  private readonly stateManager: NormalizerStateManager;
  private readonly eventPublisher: EventPublisherService;
  private lastSeekingTime: number = 0;
  private readonly SEEKING_DEBOUNCE_MS = 500;

  constructor(
    initialConfig: AudioConfig,
    private readonly logger: ILogger,
    eventPublisher: EventPublisherService
  ) {
    this.processor = new AudioProcessor(initialConfig);
    this.adapter = new WebAudioAdapter(logger);
    this.eventPublisher = eventPublisher;

    this.lifecycleObserver = new VideoLifecycleObserver(logger);
    this.normalizationLoop = new NormalizationLoop(this.adapter, this.processor, logger);
    this.stateManager = new NormalizerStateManager(
      this.adapter,
      this.normalizationLoop,
      logger,
      initialConfig.isActive
    );
    this.attachmentManager = new VideoAttachmentManager(
      this.adapter,
      this.lifecycleObserver,
      logger
    );
  }

  public attachToVideo(video: HTMLVideoElement): void {
    this.attachmentManager.attachToVideo(
      video,
      this.stateManager.isNormalizerActive(),
      () => this.handleSeeking(),
      () => this.logger.warn('Video removed from DOM - handled by caller'),
      () => this.handlePlay(),
      () => this.handleUserGesture()
    );

    this.stateManager.startLoopIfActive();
  }

  public activate(): void {
    this.stateManager.activate();
    this.eventPublisher.publishActivationChanged(true);
  }

  public deactivate(): void {
    this.stateManager.deactivate();
    this.eventPublisher.publishActivationChanged(false);
  }

  public updateConfig(config: AudioConfig): void {
    this.processor.updateConfig(config);
    this.eventPublisher.publishConfigurationChanged(config);
    this.logger.info('Audio configuration updated');
  }

  public getCurrentGain(): GainValue {
    if (!this.adapter.isInitialized()) {
      return GainValue.createSafe(1.0);
    }
    return this.adapter.getCurrentGain();
  }

  public hasVideoAttached(): boolean {
    return this.attachmentManager.hasVideoAttached();
  }

  public isNormalizerActive(): boolean {
    return this.stateManager.isNormalizerActive();
  }

  public cleanup(): void {
    this.stateManager.deactivate();
    this.attachmentManager.cleanup();
    this.adapter.cleanup();
    this.logger.info('AudioNormalizationFacade cleaned up');
  }

  private handleUserGesture(): void {
    this.adapter.resume().catch((error) => {
      this.logger.error('Failed to initialize AudioContext on click', error);
    });
  }

  private handlePlay(): void {
    this.adapter.resume().catch((error) => {
      this.logger.warn('Failed to initialize/resume AudioContext on play', error);
    });
  }

  private handleSeeking(): void {
    const now = Date.now();
    if (now - this.lastSeekingTime < this.SEEKING_DEBOUNCE_MS) {
      return;
    }
    this.lastSeekingTime = now;

    if (!this.stateManager.isNormalizerActive() || !this.adapter.isInitialized()) {
      return;
    }

    try {
      const currentGain = this.adapter.getCurrentGain();
      const resetGain = this.processor.calculateResetGain(currentGain);

      this.adapter.setGainSmooth(resetGain, AudioProcessingConstants.GAIN_SMOOTHING_SEEK_RESET);
      this.logger.info(`Seeking - resetting gain to ${resetGain.toString()}`);
    } catch (error) {
      this.logger.error('Error handling seeking', error);
    }
  }
}
