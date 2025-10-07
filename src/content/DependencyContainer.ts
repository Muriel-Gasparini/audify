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
import { NetflixDOMAdapter } from '../netflix-integration/infrastructure/NetflixDOMAdapter';
import { VideoDetectionService } from '../netflix-integration/infrastructure/VideoDetectionService';
import { AutoSkipService } from '../netflix-integration/infrastructure/AutoSkipService';
import { DetectVideoUseCase } from '../netflix-integration/application/use-cases/DetectVideoUseCase';
import { AutoSkipIntroUseCase } from '../netflix-integration/application/use-cases/AutoSkipIntroUseCase';
import { MessageBus } from '../shared/infrastructure/messaging/MessageBus';
import { UpdateConfigHandler } from '../shared/infrastructure/messaging/handlers/UpdateConfigHandler';
import { GetStateHandler } from '../shared/infrastructure/messaging/handlers/GetStateHandler';
import { ToggleNormalizerHandler } from '../shared/infrastructure/messaging/handlers/ToggleNormalizerHandler';
import { GetConfigHandler } from '../shared/infrastructure/messaging/handlers/GetConfigHandler';

/**
 * Dependency Injection Container
 * Cria e configura todas as dependências do sistema
 *
 * Padrão: Simple DI Container (não usa biblioteca externa)
 */
export class DependencyContainer {
  // Infrastructure
  private logger!: ILogger;
  private configRepository!: IConfigRepository;
  private eventPublisher!: DomainEventPublisher;

  // Services
  private audioNormalizationService!: AudioNormalizationService;

  // Use Cases - Audio
  private activateNormalizerUseCase!: ActivateNormalizerUseCase;
  private deactivateNormalizerUseCase!: DeactivateNormalizerUseCase;
  private updateAudioConfigUseCase!: UpdateAudioConfigUseCase;
  private getAudioStateUseCase!: GetAudioStateUseCase;

  // Use Cases - Netflix
  private detectVideoUseCase!: DetectVideoUseCase;
  private autoSkipIntroUseCase!: AutoSkipIntroUseCase;

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

    // Audio Normalization Service
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

    // Netflix Integration
    const netflixDOMAdapter = new NetflixDOMAdapter(this.logger);

    const videoDetectionService = new VideoDetectionService(netflixDOMAdapter, this.logger);
    this.detectVideoUseCase = new DetectVideoUseCase(videoDetectionService);

    const autoSkipService = new AutoSkipService(netflixDOMAdapter, this.logger);
    this.autoSkipIntroUseCase = new AutoSkipIntroUseCase(autoSkipService);

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
        this.configRepository
      )
    );

    this.logger.info('Dependency container initialized');
  }

  // Getters
  public getLogger(): ILogger {
    return this.logger;
  }

  public getAudioNormalizationService(): AudioNormalizationService {
    return this.audioNormalizationService;
  }

  public getDetectVideoUseCase(): DetectVideoUseCase {
    return this.detectVideoUseCase;
  }

  public getAutoSkipIntroUseCase(): AutoSkipIntroUseCase {
    return this.autoSkipIntroUseCase;
  }

  public getMessageBus(): MessageBus {
    return this.messageBus;
  }

  public getConfigRepository(): IConfigRepository {
    return this.configRepository;
  }
}
