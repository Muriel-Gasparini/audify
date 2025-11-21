import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { NetflixVideo } from '../domain/entities/NetflixVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Detects and monitors Netflix video elements.
   */
export class VideoDetectionService {
  private observer: MutationObserver | null = null;
  private retryInterval: number | null = null;
  private onVideoFoundCallback: ((video: NetflixVideo) => void) | null = null;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  public startDetection(onVideoFound: (video: NetflixVideo) => void): void {
    this.onVideoFoundCallback = onVideoFound;

    const video = this.domAdapter.findVideo();
    if (video) {
      this.logger.info('Video found immediately');
      this.onVideoFoundCallback(video);
      return;
    }

    this.observer = new MutationObserver(() => {
      this.tryDetectVideo();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
    this.logger.info('Video detection started');

    this.retryInterval = window.setInterval(() => {
      this.tryDetectVideo();
    }, 2000);

    setTimeout(() => {
      this.stopRetry();
    }, 30000);
  }

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
      this.stopRetry();
    }
  }

  private stopRetry(): void {
    if (this.retryInterval !== null) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }
}
