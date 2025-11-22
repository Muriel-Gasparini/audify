import { GainNodeWrapper } from './nodes/GainNodeWrapper';
import { CompressorNodeWrapper } from './nodes/CompressorNodeWrapper';
import { LimiterNodeWrapper } from './nodes/LimiterNodeWrapper';
import { AnalyserNodeWrapper } from './nodes/AnalyserNodeWrapper';
import { IAudioProcessingStrategy } from './strategies/IAudioProcessingStrategy';
import { ActiveProcessingStrategy } from './strategies/ActiveProcessingStrategy';
import { BypassProcessingStrategy } from './strategies/BypassProcessingStrategy';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
   * Audio Graph Builder.
   */
export class AudioGraphBuilder {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNodeWrapper: GainNodeWrapper | null = null;
  private compressorNodeWrapper: CompressorNodeWrapper | null = null;
  private limiterNodeWrapper: LimiterNodeWrapper | null = null;
  private analyserNodeWrapper: AnalyserNodeWrapper | null = null;
  private currentMediaElement: HTMLVideoElement | null = null;

  private activeStrategy: ActiveProcessingStrategy = new ActiveProcessingStrategy();
  private bypassStrategy: BypassProcessingStrategy = new BypassProcessingStrategy();

  constructor(private readonly logger: ILogger) {}

  /**
   * Initializes o grafo audio com element video.
   * AudioContext creation is deferred until resume() to comply with autoplay policy.
   */
  public initialize(mediaElement: HTMLVideoElement): void {
    if (this.currentMediaElement === mediaElement) {
      return;
    }

    if (this.currentMediaElement) {
      const isCurrentVideoInDOM = this.currentMediaElement.isConnected;
      const currentSrc = this.currentMediaElement.currentSrc || this.currentMediaElement.src;
      const newSrc = mediaElement.currentSrc || mediaElement.src;

      if (!isCurrentVideoInDOM) {
        this.logger.warn('Current video no longer in DOM, cleaning up');
        this.cleanupSync();
      } else if (currentSrc && newSrc && currentSrc === newSrc) {
        this.currentMediaElement = mediaElement;
        return;
      } else {
        this.logger.warn('Switching to different video, cleaning up');
        this.cleanupSync();
      }
    }

    this.currentMediaElement = mediaElement;
    this.logger.info('Media element stored');
  }

  private currentMode: 'ACTIVE' | 'BYPASS' | null = null;

  /**
   * Connects nodes using specified strategy.
   * If AudioContext not yet created, stores the mode for later connection.
   */
  public connect(isActive: boolean): void {
    const newMode = isActive ? 'ACTIVE' : 'BYPASS';

    if (!this.isInitialized()) {
      this.currentMode = newMode;
      return;
    }

    if (this.currentMode === newMode) {
      return;
    }

    const strategy: IAudioProcessingStrategy = isActive
      ? this.activeStrategy
      : this.bypassStrategy;

    this.disconnect();

    strategy.connect(
      this.sourceNode!,
      this.gainNodeWrapper!.getNativeNode(),
      this.compressorNodeWrapper!.getNativeNode(),
      this.limiterNodeWrapper!.getNativeNode(),
      this.analyserNodeWrapper!.getNativeNode(),
      this.audioContext!.destination
    );

    this.currentMode = newMode;
    this.logger.info(`Audio graph connected in ${newMode} mode`);
  }

  /**
   * Disconnects all nodes.
   */
  private disconnect(): void {
    if (!this.isInitialized()) return;

    try {
      this.sourceNode!.disconnect();
      this.gainNodeWrapper!.disconnect();
      this.compressorNodeWrapper!.disconnect();
      this.limiterNodeWrapper!.disconnect();
      this.analyserNodeWrapper!.disconnect();
    } catch {
    }
  }

  /**
   * Resume o AudioContext se estiver suspenso.
   * Creates AudioContext on first call (lazy initialization after user gesture).
   */
  public async resume(): Promise<void> {
    if (!this.currentMediaElement) {
      this.logger.warn('Cannot resume: no media element attached');
      return;
    }

    if (!this.audioContext) {
      this.logger.info('Creating AudioContext');
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        this.sourceNode = this.audioContext.createMediaElementSource(this.currentMediaElement);

        const gainNode = this.audioContext.createGain();
        this.gainNodeWrapper = new GainNodeWrapper(gainNode);

        const compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNodeWrapper = new CompressorNodeWrapper(compressorNode);

        const limiterNode = this.audioContext.createDynamicsCompressor();
        this.limiterNodeWrapper = new LimiterNodeWrapper(limiterNode);

        const analyserNode = this.audioContext.createAnalyser();
        this.analyserNodeWrapper = new AnalyserNodeWrapper(analyserNode);

        this.logger.info('Audio graph initialized');

        if (this.currentMode !== null) {
          const isActive = this.currentMode === 'ACTIVE';
          this.currentMode = null;
          this.connect(isActive);
        }
      } catch (error) {
        this.logger.error('Failed to create audio graph', error);
        this.audioContext = null;
        this.sourceNode = null;
        throw error;
      }
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      this.logger.info('AudioContext resumed');
    }
  }

  /**
   * Cleans all resources synchronously (for internal use during re-initialization).
   */
  private cleanupSync(): void {
    this.disconnect();

    this.audioContext = null;
    this.sourceNode = null;
    this.gainNodeWrapper = null;
    this.compressorNodeWrapper = null;
    this.limiterNodeWrapper = null;
    this.analyserNodeWrapper = null;
    this.currentMediaElement = null;
    this.currentMode = null;
  }

  /**
   * Cleans all resources.
   */
  public cleanup(): void {
    this.disconnect();

    const contextToClose = this.audioContext;

    this.audioContext = null;
    this.sourceNode = null;
    this.gainNodeWrapper = null;
    this.compressorNodeWrapper = null;
    this.limiterNodeWrapper = null;
    this.analyserNodeWrapper = null;
    this.currentMediaElement = null;
    this.currentMode = null;

    if (contextToClose) {
      contextToClose.close().catch((error) => {
        this.logger.warn('Error closing AudioContext:', error);
      });
    }

    this.logger.info('Audio graph cleaned up');
  }

  public getGainNode(): GainNodeWrapper {
    if (!this.gainNodeWrapper) {
      throw new Error('Gain node not initialized');
    }
    return this.gainNodeWrapper;
  }

  public getAnalyserNode(): AnalyserNodeWrapper {
    if (!this.analyserNodeWrapper) {
      throw new Error('Analyser node not initialized');
    }
    return this.analyserNodeWrapper;
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    return this.audioContext;
  }

  public isInitialized(): boolean {
    return this.audioContext !== null && this.sourceNode !== null;
  }

  /**
   * Check if media element is attached (even if AudioContext not yet created).
   */
  public hasMediaElement(): boolean {
    return this.currentMediaElement !== null;
  }
}
