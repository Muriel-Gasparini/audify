import { WebAudioAdapter } from './web-audio/WebAudioAdapter';
import { AudioProcessor } from '../domain/entities/AudioProcessor';
import { AudioConfig } from '../domain/value-objects/AudioConfig';
import { GainValue } from '../../shared/domain/value-objects/GainValue';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';
import { DomainEventPublisher } from '../../shared/domain/events/DomainEventPublisher';
import { NormalizerActivatedEvent } from '../../shared/domain/events/NormalizerActivatedEvent';
import { ConfigurationChangedEvent } from '../../shared/domain/events/ConfigurationChangedEvent';

/**
 * Audio Normalization Service
 * Orquestra a normalização de áudio
 *
 * Responsabilidades:
 * - Gerenciar ciclo de vida da normalização
 * - Coordenar AudioProcessor e WebAudioAdapter
 * - Executar loop de normalização
 * - Publicar eventos de domínio
 */
export class AudioNormalizationService {
  private processor: AudioProcessor;
  private adapter: WebAudioAdapter;
  private isActive: boolean = false;
  private animationFrameId: number | null = null;
  private currentVideo: HTMLVideoElement | null = null;
  private seekingListener: (() => void) | null = null;
  private videoRemovalObserver: MutationObserver | null = null;

  // Throttling do loop de normalização
  private lastNormalizationTime: number = 0;
  private readonly NORMALIZATION_INTERVAL_MS: number = 50; // 20 Hz (era ~60 Hz)

  constructor(
    initialConfig: AudioConfig,
    private readonly logger: ILogger,
    private readonly eventPublisher: DomainEventPublisher
  ) {
    this.processor = new AudioProcessor(initialConfig);
    this.adapter = new WebAudioAdapter(logger);
  }

  /**
   * Conecta o serviço a um elemento de vídeo
   */
  public attachToVideo(video: HTMLVideoElement): void {
    // Check if this is the exact same video element reference AND adapter is initialized
    if (this.currentVideo === video && this.adapter.isInitialized()) {
      this.logger.info('Already attached to this video');
      console.log('[AudioNormalizationService] attachToVideo - Already attached, skipping');
      return;
    }

    // Log detailed attachment information
    this.logger.info('Attaching to video element');
    console.log('[AudioNormalizationService] attachToVideo - NEW ATTACHMENT:', {
      videoSrc: video.src || video.currentSrc,
      videoReadyState: video.readyState,
      videoConnected: video.isConnected,
      previousVideoExists: this.currentVideo !== null,
      previousVideoConnected: this.currentVideo?.isConnected ?? false,
      sameVideoElement: this.currentVideo === video,
      adapterWasInitialized: this.adapter.isInitialized()
    });

    // IMPORTANT: Only cleanup if we're replacing with a different video
    // This prevents destroying the audio context for the same video
    if (this.currentVideo !== video) {
      console.log('[AudioNormalizationService] attachToVideo - Cleaning up previous video');
      this.cleanup();
    }

    this.currentVideo = video;

    try {
      this.adapter.attachToVideo(video);
      console.log('[AudioNormalizationService] attachToVideo - After attachment, adapter initialized:', this.adapter.isInitialized());
    } catch (error) {
      console.error('[AudioNormalizationService] FAILED to attach adapter to video:', error);
      this.logger.error('Failed to attach adapter to video', error);
      // Reset currentVideo since attachment failed
      this.currentVideo = null;
      throw error;
    }

    // Setup listener para seeking (pulo no vídeo)
    this.seekingListener = this.handleSeeking.bind(this);
    video.addEventListener('seeking', this.seekingListener);

    // Add DOM removal listener to detect when video is removed
    this.videoRemovalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === video || (node instanceof Element && node.contains(video))) {
            console.log('[AudioNormalizationService] VIDEO REMOVED FROM DOM!', {
              videoSrc: video.src || video.currentSrc,
              wasActive: this.isActive
            });
            this.logger.warn('Video element removed from DOM');
            if (this.videoRemovalObserver) {
              this.videoRemovalObserver.disconnect();
              this.videoRemovalObserver = null;
            }
            break;
          }
        }
      }
    });

    // Monitor video's parent for removal
    if (video.parentElement) {
      this.videoRemovalObserver.observe(video.parentElement, { childList: true });
    }

    if (this.isActive) {
      this.start();
    }
  }

  /**
   * Ativa a normalização
   */
  public activate(): void {
    if (this.isActive) {
      this.logger.info('Normalizer already active');
      return;
    }

    this.isActive = true;
    this.start();

    this.eventPublisher.publish(new NormalizerActivatedEvent(true));
    this.logger.info('Normalizer activated');
  }

  /**
   * Desativa a normalização
   */
  public deactivate(): void {
    if (!this.isActive) {
      this.logger.info('Normalizer already inactive');
      return;
    }

    this.isActive = false;
    this.stop();

    this.eventPublisher.publish(new NormalizerActivatedEvent(false));
    this.logger.info('Normalizer deactivated');
  }

  /**
   * Atualiza a configuração de áudio
   */
  public updateConfig(config: AudioConfig): void {
    this.processor.updateConfig(config);

    this.eventPublisher.publish(
      new ConfigurationChangedEvent({
        targetLevel: config.targetLevel.getValue(),
        maxGain: config.maxGain.getValue(),
        minGain: config.minGain.getValue(),
      })
    );

    this.logger.info('Audio configuration updated');
  }

  /**
   * Obtém o gain atual
   */
  public getCurrentGain(): GainValue {
    if (!this.adapter.isInitialized()) {
      return GainValue.createSafe(1.0);
    }
    return this.adapter.getCurrentGain();
  }

  /**
   * Verifica se tem vídeo conectado
   */
  public hasVideoAttached(): boolean {
    const hasVideo = this.currentVideo !== null;
    const isAdapterInit = this.adapter.isInitialized();
    const isVideoInDOM = this.currentVideo?.isConnected ?? false;
    const result = hasVideo && isAdapterInit && isVideoInDOM;

    console.log('[AudioNormalizationService] hasVideoAttached() check:', {
      currentVideo: this.currentVideo ? 'EXISTS' : 'NULL',
      videoInDOM: isVideoInDOM,
      adapterInitialized: isAdapterInit,
      result: result
    });

    // If video exists but is not in DOM anymore, cleanup and return false
    if (hasVideo && !isVideoInDOM) {
      console.warn('[AudioNormalizationService] Video element detached from DOM - cleaning up');
      this.logger.warn('Video element no longer in DOM, cleaning up');
      this.cleanup();
      return false;
    }

    return result;
  }

  /**
   * Verifica se está ativo
   */
  public isNormalizerActive(): boolean {
    return this.isActive;
  }

  /**
   * Inicia o processamento
   */
  private start(): void {
    if (!this.adapter.isInitialized()) {
      this.logger.warn('Cannot start: adapter not initialized');
      return;
    }

    // Resume AudioContext se necessário
    this.adapter.resume();

    // Conecta em modo ativo
    this.adapter.setActive(true);

    // Inicia loop de normalização
    if (!this.animationFrameId) {
      this.normalize();
    }

    this.logger.info('Normalization started');
  }

  /**
   * Para o processamento
   */
  private stop(): void {
    // Para o loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Conecta em modo bypass (áudio original)
    if (this.adapter.isInitialized()) {
      this.adapter.setActive(false);
    }

    this.logger.info('Normalization stopped');
  }

  /**
   * Loop de normalização (executado a cada frame)
   * Usa throttling para reduzir frequência de atualizações
   */
  private normalize = (): void => {
    if (!this.isActive) {
      return;
    }

    // Throttling: só processa a cada NORMALIZATION_INTERVAL_MS
    const now = performance.now();
    const timeSinceLastUpdate = now - this.lastNormalizationTime;

    if (timeSinceLastUpdate >= this.NORMALIZATION_INTERVAL_MS) {
      try {
        // Obtém métricas atuais
        const metrics = this.adapter.getMetrics();

        // Calcula próximo gain usando o processador de domínio
        const nextGain = this.processor.calculateNextGain(metrics);

        // Aplica o gain com suavização para evitar cliques/artefatos
        // timeConstant de 0.1s = transição suave sem artifacts audíveis
        this.adapter.setGainSmooth(nextGain, 0.1);

        this.lastNormalizationTime = now;
      } catch (error) {
        this.logger.error('Error in normalization loop', error);
      }
    }

    // Agenda próximo frame
    this.animationFrameId = requestAnimationFrame(this.normalize);
  };

  /**
   * Handler para evento de seeking (pulo no vídeo)
   */
  private handleSeeking(): void {
    if (!this.isActive || !this.adapter.isInitialized()) {
      return;
    }

    const currentGain = this.adapter.getCurrentGain();
    const resetGain = this.processor.calculateResetGain(currentGain);

    this.adapter.setGainSmooth(resetGain, 0.05);
    this.logger.info(`Video seeking detected, resetting gain to ${resetGain.toString()}`);
  }

  /**
   * Limpa todos os recursos
   */
  public cleanup(): void {
    console.log('[AudioNormalizationService] cleanup() called', {
      hadVideo: this.currentVideo !== null,
      wasActive: this.isActive,
      stackTrace: new Error().stack
    });

    this.stop();

    if (this.currentVideo && this.seekingListener) {
      this.currentVideo.removeEventListener('seeking', this.seekingListener);
      this.seekingListener = null;
    }

    if (this.videoRemovalObserver) {
      this.videoRemovalObserver.disconnect();
      this.videoRemovalObserver = null;
    }

    this.adapter.cleanup();
    this.currentVideo = null;

    this.logger.info('AudioNormalizationService cleaned up');
  }
}
