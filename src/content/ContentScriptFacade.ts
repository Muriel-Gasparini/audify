import { DependencyContainer } from './DependencyContainer';
import { MessageRouter } from './MessageRouter';
import { GenericVideo } from '../core/domain/entities/GenericVideo';
import { IVideoDiscoveryObserver } from '../core/domain/services/IVideoDiscoveryObserver';

/**
 * Content Script Facade
 * Ponto de entrada principal do content script
 *
 * ARQUITETURA:
 * - Funciona em QUALQUER site (não requer integração específica)
 * - VideoDiscoveryService encontra vídeos em qualquer página
 * - AudioNormalizationService normaliza áudio de qualquer vídeo
 * - Integrações específicas (Netflix, etc.) são OPCIONAIS e adicionam features extras
 *
 * Responsabilidades:
 * - Inicializar sistema genérico de descoberta e normalização
 * - Ativar integração específica do site (se disponível)
 * - Coordenar ciclo de vida de todos os serviços
 */
export class ContentScriptFacade implements IVideoDiscoveryObserver {
  private container!: DependencyContainer;
  private messageRouter!: MessageRouter;
  private attachedVideos = new WeakSet<HTMLVideoElement>();
  private videoMonitorInterval: number | null = null;

  /**
   * Inicializa o content script
   */
  public async initialize(): Promise<void> {
    // Cria e inicializa container de dependências
    this.container = new DependencyContainer();
    await this.container.initialize();

    const logger = this.container.getLogger();
    logger.info('Content script facade initializing...');

    // Setup Message Router
    this.messageRouter = new MessageRouter(
      this.container.getMessageBus(),
      logger
    );
    this.messageRouter.listen();

    // Inicia CORS bypass service (deve iniciar ANTES da descoberta de vídeos)
    const corsService = this.container.getCORSBypassService();
    corsService.start();

    // Tenta ativar integração específica do site (OPCIONAL)
    // Se não houver integração, tudo continua funcionando normalmente
    const integrationRegistry = this.container.getSiteIntegrationRegistry();
    integrationRegistry.activateForCurrentSite();

    // Inicia descoberta de vídeos (GENÉRICA - funciona em QUALQUER site)
    // Não depende de integração específica
    const videoDiscoveryService = this.container.getVideoDiscoveryService();
    videoDiscoveryService.addObserver(this);
    videoDiscoveryService.startDiscovery();

    // Carrega configuração e aplica estado inicial
    const config = await this.container.getConfigRepository().load();
    if (config.isActive) {
      logger.info('Normalizer configured as active, will activate when video is found');
    }

    logger.info('Content script facade initialized successfully');

    // Start periodic video health check
    // This detects when video elements are replaced and re-attaches automatically
    this.startVideoHealthMonitor();
  }

  /**
   * Monitors video health and re-attaches if video is replaced
   * This solves the common issue where video players replace the <video> element
   */
  private startVideoHealthMonitor(): void {
    const logger = this.container.getLogger();

    this.videoMonitorInterval = window.setInterval(async () => {
      const service = this.container.getAudioNormalizationService();
      const hasVideo = service.hasVideoAttached();
      const config = await this.container.getConfigRepository().load();
      const isActive = service.isNormalizerActive();

      console.log('[ContentScriptFacade] Video health check:', {
        hasVideo: hasVideo,
        configIsActive: config.isActive,
        normalizerIsActive: isActive,
        shouldForceRediscovery: !hasVideo && config.isActive
      });

      // If we lost the video BUT normalizer should be active, force rediscovery
      if (!hasVideo && config.isActive) {
        console.warn('[ContentScriptFacade] Video health check: NO VIDEO but should be ACTIVE - forcing rediscovery');
        logger.warn('Video lost but normalizer should be active - forcing rediscovery');
        const videoDiscoveryService = this.container.getVideoDiscoveryService();
        videoDiscoveryService.forceDiscovery();
      }
    }, 2000); // Check every 2 seconds

    logger.info('Video health monitor started');
  }

  /**
   * Implementação de IVideoDiscoveryObserver
   * Callback quando vídeo é descoberto
   */
  public onVideoDiscovered(video: GenericVideo): void {
    const element = video.getElement();
    const logger = this.container.getLogger();
    const service = this.container.getAudioNormalizationService();

    // Check if we already have this EXACT video element attached
    // IMPORTANT: We check if video is still in DOM before skipping
    // If video is not in DOM, we should re-attach even if in WeakSet
    const alreadyInSet = this.attachedVideos.has(element);
    const isVideoInDOM = element.isConnected;

    if (alreadyInSet && isVideoInDOM) {
      console.log('[ContentScriptFacade] onVideoDiscovered - Video already in attachedVideos WeakSet AND in DOM, skipping');
      return;
    }

    // If video was in set but is no longer in DOM, it's a stale reference
    if (alreadyInSet && !isVideoInDOM) {
      console.log('[ContentScriptFacade] onVideoDiscovered - Video was in WeakSet but NOT in DOM anymore (stale reference)');
    }

    // Check if we have a DIFFERENT video attached but it's the same src
    // This happens when video player replaces the element
    const currentHasVideo = service.hasVideoAttached();
    console.log('[ContentScriptFacade] onVideoDiscovered - Video discovery triggered:', {
      videoSrc: video.getSrc(),
      isInIframe: video.isInIframe(),
      alreadyInSet: alreadyInSet,
      isVideoInDOM: isVideoInDOM,
      currentHasVideo: currentHasVideo,
      isReattachment: !alreadyInSet && currentHasVideo
    });

    if (currentHasVideo) {
      console.log('[ContentScriptFacade] Already have a video attached - this is likely a re-attachment after forceDiscovery()');
      // Let the service handle it - it will only cleanup if different element
    }

    this.attachedVideos.add(element);

    logger.info('Video discovered, attaching audio normalizer...', {
      context: video.isInIframe() ? 'iframe' : 'main',
      src: video.getSrc(),
    });

    try {
      // SEMPRE anexa normalização de áudio (funciona em qualquer site)
      // The service will handle cleanup if this is a different video
      service.attachToVideo(element);

      // Se estava configurado como ativo, ativa agora
      this.container.getConfigRepository().load().then((config) => {
        if (config.isActive) {
          service.activate();
          logger.info('Normalizer activated (was configured as active)');
        }
      });

      // Notifica integração específica do site (OPCIONAL - só se existir)
      // Permite features extras como auto-skip no Netflix
      const integrationRegistry = this.container.getSiteIntegrationRegistry();
      const activeIntegration = integrationRegistry.getActiveIntegration();

      if (activeIntegration && activeIntegration.onVideoDetected) {
        logger.debug('Notifying site-specific integration about video');
        activeIntegration.onVideoDetected(video);
      }
    } catch (error) {
      logger.error('Failed to attach to video', error);
    }
  }

  /**
   * Cleanup quando content script é destruído
   */
  public cleanup(): void {
    const logger = this.container?.getLogger();
    logger?.info('Content script facade cleaning up...');

    // Stop video health monitor
    if (this.videoMonitorInterval !== null) {
      clearInterval(this.videoMonitorInterval);
      this.videoMonitorInterval = null;
    }

    // Para descoberta de vídeos
    const videoDiscoveryService = this.container?.getVideoDiscoveryService();
    videoDiscoveryService?.stopDiscovery();

    // Para CORS bypass
    const corsService = this.container?.getCORSBypassService();
    corsService?.stop();

    // Limpa integração específica
    const integrationRegistry = this.container?.getSiteIntegrationRegistry();
    integrationRegistry?.cleanup();

    // Para message router
    this.messageRouter?.stopListening();

    logger?.info('Content script facade cleaned up');
  }
}
