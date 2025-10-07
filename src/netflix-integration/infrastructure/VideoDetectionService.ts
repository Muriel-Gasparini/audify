import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { NetflixVideo } from '../domain/entities/NetflixVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Video Detection Service
 * Detecta e monitora o elemento de vídeo do Netflix
 *
 * Responsabilidades:
 * - Detectar quando um vídeo aparece no DOM
 * - Notificar callbacks quando vídeo é encontrado
 * - Usar MutationObserver para monitoramento contínuo
 */
export class VideoDetectionService {
  private observer: MutationObserver | null = null;
  private retryInterval: number | null = null;
  private onVideoFoundCallback: ((video: NetflixVideo) => void) | null = null;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  /**
   * Inicia a detecção de vídeo
   */
  public startDetection(onVideoFound: (video: NetflixVideo) => void): void {
    this.onVideoFoundCallback = onVideoFound;

    // Tenta detectar imediatamente
    const video = this.domAdapter.findVideo();
    if (video) {
      this.logger.info('Video found immediately');
      this.onVideoFoundCallback(video);
      return;
    }

    // Setup MutationObserver
    this.observer = new MutationObserver(() => {
      this.tryDetectVideo();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
    this.logger.info('Video detection started');

    // Setup retry interval (a cada 2 segundos)
    this.retryInterval = window.setInterval(() => {
      this.tryDetectVideo();
    }, 2000);

    // Para de tentar após 30 segundos
    setTimeout(() => {
      this.stopRetry();
    }, 30000);
  }

  /**
   * Para a detecção
   */
  public stopDetection(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.stopRetry();
    this.logger.info('Video detection stopped');
  }

  private tryDetectVideo(): void {
    const video = this.domAdapter.findVideo();

    if (video && this.onVideoFoundCallback) {
      this.logger.info('Video found');
      this.onVideoFoundCallback(video);
      this.stopRetry(); // Para de tentar quando encontra
    }
  }

  private stopRetry(): void {
    if (this.retryInterval !== null) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }
}
