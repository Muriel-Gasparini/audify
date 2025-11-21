import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Automatically skips Netflix intros, recaps, and credits.
   */
export class AutoSkipService {
  private observer: MutationObserver | null = null;
  private isRunning: boolean = false;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  public start(): void {
    if (this.isRunning) {
      this.logger.debug('Auto-skip service already running');
      return;
    }

    this.isRunning = true;

    this.observer = new MutationObserver(() => {
      this.trySkip();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });

    this.trySkip();

    this.logger.info('Auto-skip service started');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.isRunning = false;
    this.logger.info('Auto-skip service stopped');
  }

  public isActive(): boolean {
    return this.isRunning;
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
      return;
    }

    const skipCreditsButton = this.domAdapter.findSkipCreditsButton();
    if (skipCreditsButton) {
      this.logger.info('Skip credits button found, clicking...');
      this.domAdapter.clickButton(skipCreditsButton);
      return;
    }
  }
}
