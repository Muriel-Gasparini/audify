import { DependencyContainer } from './DependencyContainer';
import { MessageRouter } from './MessageRouter';
import { NetflixVideo } from '../netflix-integration/domain/entities/NetflixVideo';

/**
 * Content Script Facade
 * Ponto de entrada principal do content script
 *
 * Responsabilidades:
 * - Inicializar sistema
 * - Coordenar auto-skip e detecção de vídeo
 * - Gerenciar ciclo de vida
 */
export class ContentScriptFacade {
  private container!: DependencyContainer;
  private messageRouter!: MessageRouter;

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

    // Inicia auto-skip
    const autoSkipUseCase = this.container.getAutoSkipIntroUseCase();
    autoSkipUseCase.start();

    // Inicia detecção de vídeo
    const detectVideoUseCase = this.container.getDetectVideoUseCase();
    detectVideoUseCase.execute((video: NetflixVideo) => {
      this.onVideoFound(video);
    });

    // Carrega configuração e aplica estado inicial
    const config = await this.container.getConfigRepository().load();
    if (config.isActive) {
      logger.info('Normalizer configured as active, will activate when video is found');
    }

    logger.info('Content script facade initialized successfully');
  }

  /**
   * Callback quando vídeo é encontrado
   */
  private onVideoFound(video: NetflixVideo): void {
    const logger = this.container.getLogger();
    logger.info('Video found, attaching audio normalizer...');

    const service = this.container.getAudioNormalizationService();
    service.attachToVideo(video.getElement());

    // Se estava configurado como ativo, ativa agora
    this.container.getConfigRepository().load().then((config) => {
      if (config.isActive) {
        service.activate();
        logger.info('Normalizer activated (was configured as active)');
      }
    });
  }
}
