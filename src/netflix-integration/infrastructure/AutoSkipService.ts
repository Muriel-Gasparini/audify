import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Auto Skip Service
 * Pula automaticamente aberturas e recaps do Netflix
 *
 * Responsabilidades:
 * - Detectar botões de skip
 * - Clicar automaticamente
 * - Usar MutationObserver para monitoramento contínuo
 */
export class AutoSkipService {
  private observer: MutationObserver | null = null;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  /**
   * Inicia o auto-skip
   */
  public start(): void {
    // Setup MutationObserver para detectar botões de skip
    this.observer = new MutationObserver(() => {
      this.trySkip();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });

    // Tenta skip imediatamente
    this.trySkip();

    this.logger.info('Auto-skip service started');
  }

  /**
   * Para o auto-skip
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.logger.info('Auto-skip service stopped');
  }

  /**
   * Tenta detectar e clicar nos botões de skip
   */
  private trySkip(): void {
    // Tenta pular abertura
    const skipIntroButton = this.domAdapter.findSkipIntroButton();
    if (skipIntroButton) {
      this.logger.info('Skip intro button found, clicking...');
      this.domAdapter.clickButton(skipIntroButton);
      return;
    }

    // Tenta pular recap
    const skipRecapButton = this.domAdapter.findSkipRecapButton();
    if (skipRecapButton) {
      this.logger.info('Skip recap button found, clicking...');
      this.domAdapter.clickButton(skipRecapButton);
    }
  }
}
