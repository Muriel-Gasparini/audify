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

  private activeStrategy: ActiveProcessingStrategy = new ActiveProcessingStrategy();
  private bypassStrategy: BypassProcessingStrategy = new BypassProcessingStrategy();

  constructor(private readonly logger: ILogger) {}

  /**
   * Initializes o grafo audio com element video.
   */
  public initialize(mediaElement: HTMLVideoElement): void {
    if (this.audioContext) {
      this.logger.warn('Audio graph already initialized, cleaning up first');
      this.logger.debug('Already initialized, cleaning up');
      this.cleanup();
    }

    try {
      this.logger.debug('Starting initialization...');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.logger.debug('AudioContext created, state:', this.audioContext.state);

      this.sourceNode = this.audioContext.createMediaElementSource(mediaElement);
      this.logger.debug('MediaElementSource created');

      const gainNode = this.audioContext.createGain();
      this.gainNodeWrapper = new GainNodeWrapper(gainNode);

      const compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNodeWrapper = new CompressorNodeWrapper(compressorNode);

      const limiterNode = this.audioContext.createDynamicsCompressor();
      this.limiterNodeWrapper = new LimiterNodeWrapper(limiterNode);

      const analyserNode = this.audioContext.createAnalyser();
      this.analyserNodeWrapper = new AnalyserNodeWrapper(analyserNode);

      this.logger.debug('All nodes created successfully');
      this.logger.info('Audio graph initialized successfully');
    } catch (error) {
      this.logger.error('CRITICAL ERROR during initialization:', error);
      this.logger.error('Failed to initialize audio graph', error);
      throw error;
    }
  }

  private currentMode: 'ACTIVE' | 'BYPASS' | null = null;

  /**
   * Connects nodes using specified strategy.
   */
  public connect(isActive: boolean): void {
    if (!this.isInitialized()) {
      throw new Error('Audio graph not initialized');
    }

    const newMode = isActive ? 'ACTIVE' : 'BYPASS';

    if (this.currentMode === newMode) {
      this.logger.debug(`Already in ${newMode} mode, skipping reconnection`);
      this.logger.debug(`Already in ${newMode} mode, skipping reconnection`);
      return;
    }

    const strategy: IAudioProcessingStrategy = isActive
      ? this.activeStrategy
      : this.bypassStrategy;

    this.logger.debug(`Connecting audio graph in ${newMode} mode...`);

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

    if (isActive) {
      this.logger.debug('Audio path: video → gain → compressor → limiter → SPEAKERS (with processing)');
    } else {
      this.logger.debug('Audio path: video → SPEAKERS (direct, no processing)');
    }

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
   */
  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      this.logger.info('AudioContext resumed');
    }
  }

  /**
   * Cleans all resources.
   */
  public cleanup(): void {
    this.disconnect();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.sourceNode = null;
    this.gainNodeWrapper = null;
    this.compressorNodeWrapper = null;
    this.limiterNodeWrapper = null;
    this.analyserNodeWrapper = null;
    this.currentMode = null;

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
    const result = this.audioContext !== null && this.sourceNode !== null;
    this.logger.debug('isInitialized() called:', {
      audioContext: this.audioContext ? 'EXISTS' : 'NULL',
      sourceNode: this.sourceNode ? 'EXISTS' : 'NULL',
      result: result
    });
    return result;
  }
}
