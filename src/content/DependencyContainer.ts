import { ConsoleLogger } from '../shared/infrastructure/logger/ConsoleLogger';
import { ILogger } from '../shared/infrastructure/logger/ILogger';
import { ChromeStorageConfigRepository } from '../shared/infrastructure/storage/ChromeStorageConfigRepository';
import { IConfigRepository } from '../shared/infrastructure/storage/IConfigRepository';
import { DomainEventPublisher } from '../shared/domain/events/DomainEventPublisher';
import { AudioNormalizationService } from '../audio-normalization/infrastructure/AudioNormalizationService';
import { AudioConfig } from '../audio-normalization/domain/value-objects/AudioConfig';
import { ActivateNormalizerUseCase } from '../audio-normalization/application/use-cases/ActivateNormalizerUseCase';
import { DeactivateNormalizerUseCase } from '../audio-normalization/application/use-cases/DeactivateNormalizerUseCase';
import { UpdateAudioConfigUseCase } from '../audio-normalization/application/use-cases/UpdateAudioConfigUseCase';
import { GetAudioStateUseCase } from '../audio-normalization/application/use-cases/GetAudioStateUseCase';
import { MessageBus } from '../shared/infrastructure/messaging/MessageBus';
import { UpdateConfigHandler } from '../shared/infrastructure/messaging/handlers/UpdateConfigHandler';
import { GetStateHandler } from '../shared/infrastructure/messaging/handlers/GetStateHandler';
import { ToggleNormalizerHandler } from '../shared/infrastructure/messaging/handlers/ToggleNormalizerHandler';
import { GetConfigHandler } from '../shared/infrastructure/messaging/handlers/GetConfigHandler';
import { GetSiteInfoHandler } from '../shared/infrastructure/messaging/handlers/GetSiteInfoHandler';

// Core - Generic video detection
import { GenericDOMAdapter } from '../core/infrastructure/GenericDOMAdapter';
import { VideoDiscoveryService } from '../core/infrastructure/VideoDiscoveryService';
import { CORSBypassService } from '../core/infrastructure/CORSBypassService';

// Site Integrations
import { SiteIntegrationRegistry } from '../site-integrations/SiteIntegrationRegistry';
import { NetflixIntegration } from '../site-integrations/netflix/NetflixIntegration';

/**
 * Dependency Injection Container
 * Cria e configura todas as dependências do sistema
 *
 * ARQUITETURA:
 *
 * 1. CORE GENÉRICO (funciona em QUALQUER site):
 *    - VideoDiscoveryService: encontra vídeos automaticamente
 *    - AudioNormalizationService: normaliza áudio de qualquer vídeo
 *    - CORSBypassService: permite acesso cross-origin quando necessário
 *
 * 2. INTEGRAÇÕES ESPECÍFICAS (OPCIONAIS - adicionam features extras):
 *    - Netflix: auto-skip de intros/recaps
 *    - YouTube: (futuro) pular anúncios
 *    - Outros sites: adicionados conforme necessário
 *
 * IMPORTANTE:
 * - Sites SEM integração: funcionam normalmente (normalização de áudio)
 * - Sites COM integração: ganham features específicas extras
 * - Não é necessário criar integração para cada site novo
 *
 * Padrão: Simple DI Container (não usa biblioteca externa)
 */
export class DependencyContainer {
  // Infrastructure
  private logger!: ILogger;
  private configRepository!: IConfigRepository;
  private eventPublisher!: DomainEventPublisher;

  // Core Services - Generic
  private genericDOMAdapter!: GenericDOMAdapter;
  private videoDiscoveryService!: VideoDiscoveryService;
  private corsBypassService!: CORSBypassService;

  // Site Integrations
  private siteIntegrationRegistry!: SiteIntegrationRegistry;

  // Audio Normalization Service
  private audioNormalizationService!: AudioNormalizationService;

  // Use Cases - Audio
  private activateNormalizerUseCase!: ActivateNormalizerUseCase;
  private deactivateNormalizerUseCase!: DeactivateNormalizerUseCase;
  private updateAudioConfigUseCase!: UpdateAudioConfigUseCase;
  private getAudioStateUseCase!: GetAudioStateUseCase;

  // Messaging
  private messageBus!: MessageBus;

  /**
   * Inicializa todas as dependências
   */
  public async initialize(): Promise<void> {
    // Infrastructure layer
    this.logger = new ConsoleLogger('[Netfrix]');
    this.configRepository = new ChromeStorageConfigRepository(this.logger);
    this.eventPublisher = DomainEventPublisher.getInstance();

    // Carrega configuração inicial
    const config = await this.configRepository.load();
    const audioConfig = AudioConfig.fromPrimitives(
      config.targetLevel,
      config.maxGain,
      config.minGain
    );

    // Core - Generic video detection (works on any site)
    this.genericDOMAdapter = new GenericDOMAdapter(this.logger);
    this.videoDiscoveryService = new VideoDiscoveryService(
      this.genericDOMAdapter,
      this.logger
    );
    this.corsBypassService = new CORSBypassService(this.logger);

    // Audio Normalization Service (generic - works with any video)
    this.audioNormalizationService = new AudioNormalizationService(
      audioConfig,
      this.logger,
      this.eventPublisher
    );

    // Audio Use Cases
    this.activateNormalizerUseCase = new ActivateNormalizerUseCase(
      this.audioNormalizationService,
      this.logger
    );

    this.deactivateNormalizerUseCase = new DeactivateNormalizerUseCase(
      this.audioNormalizationService,
      this.logger
    );

    this.updateAudioConfigUseCase = new UpdateAudioConfigUseCase(
      this.audioNormalizationService,
      this.configRepository,
      this.logger
    );

    this.getAudioStateUseCase = new GetAudioStateUseCase(this.audioNormalizationService);

    // Site Integration Registry
    this.siteIntegrationRegistry = new SiteIntegrationRegistry(this.logger);

    // Register site-specific integrations
    this.registerSiteIntegrations();

    // Message Bus & Handlers
    this.messageBus = new MessageBus(this.logger);

    this.messageBus.register(
      'GET_CONFIG',
      new GetConfigHandler(this.configRepository)
    );

    this.messageBus.register(
      'UPDATE_CONFIG',
      new UpdateConfigHandler(this.updateAudioConfigUseCase, this.configRepository)
    );

    this.messageBus.register(
      'GET_STATE',
      new GetStateHandler(this.getAudioStateUseCase)
    );

    this.messageBus.register(
      'TOGGLE_NORMALIZER',
      new ToggleNormalizerHandler(
        this.activateNormalizerUseCase,
        this.deactivateNormalizerUseCase,
        this.configRepository,
        this.logger
      )
    );

    this.messageBus.register(
      'GET_SITE_INFO',
      new GetSiteInfoHandler(this.siteIntegrationRegistry)
    );

    this.logger.info('Dependency container initialized');
  }

  /**
   * Registra integrações específicas de sites (OPCIONAIS)
   *
   * IMPORTANTE:
   * - Estas integrações são OPCIONAIS
   * - Sites não listados aqui funcionam normalmente (modo genérico)
   * - Adicione integrações apenas se o site precisa de features específicas
   *
   * Exemplos de quando criar integração:
   * - Netflix: tem botões de skip que queremos automatizar
   * - YouTube: tem anúncios que queremos pular
   * - Twitch: tem chat/badges específicos
   *
   * Exemplos de quando NÃO criar:
   * - Sites genéricos de vídeo: já funcionam automaticamente
   * - Sites que só precisam de normalização de áudio
   */
  private registerSiteIntegrations(): void {
    // Netflix Integration - adiciona auto-skip de intros/recaps
    const netflixIntegration = new NetflixIntegration(this.logger);
    this.siteIntegrationRegistry.register(netflixIntegration);

    // Futuramente: adicione apenas se precisar de features específicas
    // const youtubeIntegration = new YouTubeIntegration(this.logger);
    // this.siteIntegrationRegistry.register(youtubeIntegration);

    this.logger.info('Optional site integrations registered');
  }

  // Getters
  public getLogger(): ILogger {
    return this.logger;
  }

  public getAudioNormalizationService(): AudioNormalizationService {
    return this.audioNormalizationService;
  }

  public getVideoDiscoveryService(): VideoDiscoveryService {
    return this.videoDiscoveryService;
  }

  public getCORSBypassService(): CORSBypassService {
    return this.corsBypassService;
  }

  public getSiteIntegrationRegistry(): SiteIntegrationRegistry {
    return this.siteIntegrationRegistry;
  }

  public getMessageBus(): MessageBus {
    return this.messageBus;
  }

  public getConfigRepository(): IConfigRepository {
    return this.configRepository;
  }
}
