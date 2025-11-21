import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Automatically skips Netflix intros and recaps.
   */
export class AutoSkipService {
  private observer: MutationObserver | null = null;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  public start(): void {
    this.observer = new MutationObserver(() => {
      this.trySkip();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });

    this.trySkip();

    this.logger.info('Auto-skip service started');
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.logger.info('Auto-skip service stopped');
  }

  private trySkip(): void {
    const skipIntroButton = this.domAdapter.findSkipIntroButton();
    if (skipIntroButton) {
      this.logger.info('Skip intro button found, clicking...');
      this.domAdapter.clickButton(skipIntroButton);
      return;
    }

    const skipRecapButton = this.domAdapter.findSkipRecapButton();
    if (skipRecapButton) {
      this.logger.info('Skip recap button found, clicking...');
      this.domAdapter.clickButton(skipRecapButton);
    }
  }
}
