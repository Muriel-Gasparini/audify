import { ISiteIntegration } from '../ISiteIntegration';
import { GenericVideo } from '../../core/domain/entities/GenericVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * YouTube-specific site integration.
   */
export class YouTubeIntegration implements ISiteIntegration {
  private active: boolean = false;

  constructor(private readonly logger: ILogger) {}

  public getName(): string {
    return 'YouTube';
  }

  public getSupportedHostnames(): string[] {
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', '*.youtube.com'];
  }

  public initialize(): void {
    if (this.active) {
      this.logger.debug('YouTube integration already initialized');
      return;
    }

    this.active = true;
    this.logger.info('YouTube integration initialized');
  }

  public onVideoDetected(video: GenericVideo): void {
    this.logger.debug('YouTube integration: video detected', {
      isInIframe: video.isInIframe(),
      src: video.getSrc(),
    });
  }

  public cleanup(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.logger.info('YouTube integration cleaned up');
  }

  public isActive(): boolean {
    return this.active;
  }
}
