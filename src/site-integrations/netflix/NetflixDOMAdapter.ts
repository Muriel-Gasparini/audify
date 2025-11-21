import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Netflix-specific DOM adapter for skip buttons.
   */
export class NetflixDOMAdapter {
  private static readonly SKIP_INTRO_SELECTOR = '[data-uia="player-skip-intro"]';
  private static readonly SKIP_RECAP_SELECTOR = '[data-uia="player-skip-recap"]';
  private static readonly SKIP_CREDITS_SELECTOR = '[data-uia="player-skip-credits"]';
  private static readonly NEXT_EPISODE_SELECTOR = '[data-uia="next-episode-seamless-button"]';

  constructor(private readonly logger: ILogger) {}

  public findSkipIntroButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.SKIP_INTRO_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  public findSkipRecapButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.SKIP_RECAP_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  public findSkipCreditsButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.SKIP_CREDITS_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  public findNextEpisodeButton(): HTMLElement | null {
    const button = document.querySelector(NetflixDOMAdapter.NEXT_EPISODE_SELECTOR);

    if (button instanceof HTMLElement) {
      return button;
    }

    return null;
  }

  public clickButton(button: HTMLElement): void {
    button.click();
    this.logger.info('Button clicked', { selector: button.getAttribute('data-uia') });
  }
}
