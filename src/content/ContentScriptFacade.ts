import { DependencyContainer } from './DependencyContainer';
import { MessageRouter } from './MessageRouter';
import { GenericVideo } from '../core/domain/entities/GenericVideo';
import { IVideoDiscoveryObserver } from '../core/domain/services/IVideoDiscoveryObserver';

/**
   * Content Script Facade.
   */
export class ContentScriptFacade implements IVideoDiscoveryObserver {
  private container!: DependencyContainer;
  private messageRouter!: MessageRouter;
  private attachedVideos = new WeakSet<HTMLVideoElement>();
  private videoMonitorInterval: number | null = null;

  private isShuttingDown: boolean = false;

  private consecutiveHealthCheckFailures: number = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  /**
   * Initializes content script.
   */
  public async initialize(): Promise<void> {
    this.container = new DependencyContainer();
    await this.container.initialize();

    const logger = this.container.getLogger();
    logger.info('Content script facade initializing...');

    this.messageRouter = new MessageRouter(
      this.container.getMessageBus(),
      logger
    );
    this.messageRouter.listen();

    const corsService = this.container.getCORSBypassService();
    corsService.start();

    const integrationRegistry = this.container.getSiteIntegrationRegistry();
    integrationRegistry.activateForCurrentSite();

    const videoDiscoveryService = this.container.getVideoDiscoveryService();
    videoDiscoveryService.addObserver(this);
    videoDiscoveryService.startDiscovery();

    const config = await this.container.getConfigRepository().load();
    if (config.isActive) {
      logger.info('Normalizer configured as active, will activate when video is found');
    }

    logger.info('Content script facade initialized successfully');

    this.startVideoHealthMonitor();
  }

  /**
   * Monitors video health and re-attaches if video is replaced.
   */
  private startVideoHealthMonitor(): void {
    const logger = this.container.getLogger();

    this.videoMonitorInterval = window.setInterval(async () => {
      if (this.isShuttingDown) {
        return;
      }

      if (!this.isExtensionContextValid()) {
        this.initiateShutdown('Extension context invalidated');
        return;
      }

      try {
        const service = this.container.getAudioNormalizationService();
        const hasVideo = service.hasVideoAttached();
        const config = await this.container.getConfigRepository().load();
        const isActive = service.isNormalizerActive();

        const isHealthy = hasVideo || !config.isActive || isActive;

        if (isHealthy) {
          if (this.consecutiveHealthCheckFailures > 0) {
            this.consecutiveHealthCheckFailures = 0;
          }
        } else {
          this.consecutiveHealthCheckFailures++;
          logger.warn(`Video health check failed (${this.consecutiveHealthCheckFailures}/${this.MAX_CONSECUTIVE_FAILURES})`);

          if (this.consecutiveHealthCheckFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            logger.warn(`Video lost for ${this.MAX_CONSECUTIVE_FAILURES} checks - forcing rediscovery`);
            this.consecutiveHealthCheckFailures = 0;

            const videoDiscoveryService = this.container.getVideoDiscoveryService();
            videoDiscoveryService.forceDiscovery();
          }
        }
      } catch (error) {
        if (this.isContextInvalidatedError(error)) {
          this.initiateShutdown('Extension context invalidated during health check', error);
          return;
        }
        logger.error('Error in health check', error);
      }
    }, 3000);

    logger.info('Video health monitor started with failure tolerance');
  }

  /**
   * Implementation of IVideoDiscoveryObserver.
   */
  public onVideoDiscovered(video: GenericVideo): void {
    if (this.isShuttingDown) {
      return;
    }

    const element = video.getElement();
    const logger = this.container.getLogger();
    const service = this.container.getAudioNormalizationService();

    const alreadyInSet = this.attachedVideos.has(element);
    const isVideoInDOM = element.isConnected;

    if (alreadyInSet && isVideoInDOM) {
      return;
    }

    this.attachedVideos.add(element);

    logger.info('Video discovered, attaching audio normalizer...', {
      context: video.isInIframe() ? 'iframe' : 'main',
      src: video.getSrc(),
    });

    try {
      service.attachToVideo(element);

      this.container.getConfigRepository().load().then((config) => {
        if (config.isActive) {
          service.activate();
          logger.info('Normalizer activated (was configured as active)');
        }
      });

      const integrationRegistry = this.container.getSiteIntegrationRegistry();
      const activeIntegration = integrationRegistry.getActiveIntegration();

      if (activeIntegration && activeIntegration.onVideoDetected) {
        activeIntegration.onVideoDetected(video);
      }
    } catch (error) {
      logger.error('Failed to attach to video', error);
    }
  }

  /**
   * Initiates graceful shutdown of the content script.
   */
  private initiateShutdown(reason: string, error?: unknown): void {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    const logger = this.container?.getLogger();
    logger?.error(`${reason} - shutting down gracefully`);

    if (error) {
      logger?.error(`${reason}`, error);
    } else {
      logger?.error(reason);
    }

    this.cleanup();
  }

  /**
   * Cleanup when content script is destroyed.
   */
  public cleanup(): void {
    const logger = this.container?.getLogger();
    logger?.info('Content script facade cleaning up...');

    if (this.videoMonitorInterval !== null) {
      clearInterval(this.videoMonitorInterval);
      this.videoMonitorInterval = null;
    }

    try {
      const videoDiscoveryService = this.container?.getVideoDiscoveryService();
      videoDiscoveryService?.stopDiscovery();

      const corsService = this.container?.getCORSBypassService();
      corsService?.stop();

      const integrationRegistry = this.container?.getSiteIntegrationRegistry();
      integrationRegistry?.cleanup();

      this.messageRouter?.stopListening();
    } catch (cleanupError) {
      logger?.error('Error during cleanup:', cleanupError);
    }

    logger?.info('Content script facade cleaned up');
  }

  /**
   * Check if extension context is valid.
   */
  private isExtensionContextValid(): boolean {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  /**
   * Detect if error is due to extension context invalidation.
   */
  private isContextInvalidatedError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('Extension context invalidated') ||
      message.includes('cannot access chrome') ||
      message.includes('Extension context')
    );
  }
}
