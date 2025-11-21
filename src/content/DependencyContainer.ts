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

import { GenericDOMAdapter } from '../core/infrastructure/GenericDOMAdapter';
import { VideoDiscoveryService } from '../core/infrastructure/VideoDiscoveryService';
import { CORSBypassService } from '../core/infrastructure/CORSBypassService';

import { SiteIntegrationRegistry } from '../site-integrations/SiteIntegrationRegistry';
import { NetflixIntegration } from '../site-integrations/netflix/NetflixIntegration';

/**
   * Dependency injection container for system components.
   */
export class DependencyContainer {
  private logger!: ILogger;
  private configRepository!: IConfigRepository;
  private eventPublisher!: DomainEventPublisher;

  private genericDOMAdapter!: GenericDOMAdapter;
  private videoDiscoveryService!: VideoDiscoveryService;
  private corsBypassService!: CORSBypassService;

  private siteIntegrationRegistry!: SiteIntegrationRegistry;

  private audioNormalizationService!: AudioNormalizationService;

  private activateNormalizerUseCase!: ActivateNormalizerUseCase;
  private deactivateNormalizerUseCase!: DeactivateNormalizerUseCase;
  private updateAudioConfigUseCase!: UpdateAudioConfigUseCase;
  private getAudioStateUseCase!: GetAudioStateUseCase;

  private messageBus!: MessageBus;

  public async initialize(): Promise<void> {
    this.logger = new ConsoleLogger('[Netfrix]');
    this.configRepository = new ChromeStorageConfigRepository(this.logger);
    this.eventPublisher = DomainEventPublisher.getInstance();

    const config = await this.configRepository.load();
    const audioConfig = AudioConfig.fromPrimitives(
      config.targetLevel,
      config.maxGain,
      config.minGain
    );

    this.genericDOMAdapter = new GenericDOMAdapter(this.logger);
    this.videoDiscoveryService = new VideoDiscoveryService(
      this.genericDOMAdapter,
      this.logger
    );
    this.corsBypassService = new CORSBypassService(this.logger);

    this.audioNormalizationService = new AudioNormalizationService(
      audioConfig,
      this.logger,
      this.eventPublisher
    );

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

    this.siteIntegrationRegistry = new SiteIntegrationRegistry(this.logger);

    this.registerSiteIntegrations();

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

  private registerSiteIntegrations(): void {
    const netflixIntegration = new NetflixIntegration(this.logger);
    this.siteIntegrationRegistry.register(netflixIntegration);

    this.logger.info('Optional site integrations registered');
  }

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
