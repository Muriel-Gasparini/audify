import { ISiteIntegration } from '../ISiteIntegration';
import { GenericVideo } from '../../core/domain/entities/GenericVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * YouTube Integration (EXEMPLO FUTURO)
 * Implementação de funcionalidades específicas do YouTube
 *
 * Funcionalidades futuras:
 * - Auto-skip de anúncios (se permitido)
 * - Features específicas do YouTube
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

    // Aqui poderiam ser iniciados serviços específicos do YouTube
    // Ex: AutoSkipAdsService, PlaylistEnhancer, etc.
  }

  public onVideoDetected(video: GenericVideo): void {
    // YouTube-specific logic quando vídeo é detectado
    this.logger.debug('YouTube integration: video detected', {
      isInIframe: video.isInIframe(),
      src: video.getSrc(),
    });

    // Exemplo: poderia detectar se é um vídeo principal ou um anúncio
    // e aplicar lógica específica
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
