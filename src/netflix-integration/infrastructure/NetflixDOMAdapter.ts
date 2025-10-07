import { NetflixVideo } from '../domain/entities/NetflixVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Netflix DOM Adapter
 * Adapter para o DOM do Netflix
 *
 * Responsabilidades:
 * - Encontrar elementos específicos do Netflix
 * - Encapsular seletores CSS
 */
export class NetflixDOMAdapter {
  private static readonly VIDEO_SELECTOR = 'video';
  private static readonly SKIP_INTRO_SELECTOR = '[data-uia="player-skip-intro"]';
  private static readonly SKIP_RECAP_SELECTOR = '[data-uia="player-skip-recap"]';

  constructor(private readonly logger: ILogger) {}

  /**
   * Encontra o elemento de vídeo do Netflix
   */
  public findVideo(): NetflixVideo | null {
    const videoElement = document.querySelector(NetflixDOMAdapter.VIDEO_SELECTOR);

    if (!(videoElement instanceof HTMLVideoElement)) {
      return null;
    }

    const video = new NetflixVideo(videoElement);

    if (!video.isReady()) {
      this.logger.debug('Video element found but not ready');
      return null;
    }

    return video;
  }

  /**
   * Encontra o botão de pular abertura
   */
  public findSkipIntroButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.SKIP_INTRO_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  /**
   * Encontra o botão de pular recap
   */
  public findSkipRecapButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.SKIP_RECAP_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  /**
   * Clica em um botão se existir
   */
  public clickButton(button: HTMLElement): void {
    button.click();
    this.logger.info('Button clicked', { selector: button.getAttribute('data-uia') });
  }
}
