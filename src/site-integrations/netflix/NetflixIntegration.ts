import { ISiteIntegration } from '../ISiteIntegration';
import { GenericVideo } from '../../core/domain/entities/GenericVideo';
import { AutoSkipService } from './AutoSkipService';
import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Netflix-specific site integration for auto-skip features.
   */
export class NetflixIntegration implements ISiteIntegration {
  private autoSkipService: AutoSkipService;
  private domAdapter: NetflixDOMAdapter;
  private active: boolean = false;

  constructor(private readonly logger: ILogger) {
    this.domAdapter = new NetflixDOMAdapter(logger);
    this.autoSkipService = new AutoSkipService(this.domAdapter, logger);
  }

  public getName(): string {
    return 'Netflix';
  }

  public getSupportedHostnames(): string[] {
    return ['netflix.com', 'www.netflix.com', '*.netflix.com'];
  }

  public initialize(): void {
    if (this.active) {
      this.logger.debug('Netflix integration already initialized');
      return;
    }

    this.active = true;
    this.autoSkipService.start();
    this.logger.info('Netflix integration initialized');
  }

  public onVideoDetected(video: GenericVideo): void {
    this.logger.debug('Netflix integration: video detected', {
      isInIframe: video.isInIframe(),
      src: video.getSrc(),
    });
  }

  public cleanup(): void {
    if (!this.active) {
      return;
    }

    this.autoSkipService.stop();
    this.active = false;
    this.logger.info('Netflix integration cleaned up');
  }

  public isActive(): boolean {
    return this.active;
  }

  public getAutoSkipService(): AutoSkipService {
    return this.autoSkipService;
  }
}
