import { NetflixDOMAdapter } from './NetflixDOMAdapter';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Auto Skip Service
 * Pula automaticamente aberturas, recaps e créditos do Netflix
 *
 * Responsabilidades:
 * - Detectar botões de skip
 * - Clicar automaticamente
 * - Usar MutationObserver para monitoramento contínuo
 */
export class AutoSkipService {
  private observer: MutationObserver | null = null;
  private isRunning: boolean = false;

  constructor(
    private readonly domAdapter: NetflixDOMAdapter,
    private readonly logger: ILogger
  ) {}

  /**
   * Inicia o auto-skip
   */
  public start(): void {
    if (this.isRunning) {
      this.logger.debug('Auto-skip service already running');
      return;
    }

    this.isRunning = true;

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

  /**
   * Verifica se o serviço está rodando
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Tenta detectar e clicar nos botões de skip
   */
  private trySkip(): void {
    // Prioridade 1: Pular abertura
    const skipIntroButton = this.domAdapter.findSkipIntroButton();
    if (skipIntroButton) {
      this.logger.info('Skip intro button found, clicking...');
      this.domAdapter.clickButton(skipIntroButton);
      return;
    }

    // Prioridade 2: Pular recap
    const skipRecapButton = this.domAdapter.findSkipRecapButton();
    if (skipRecapButton) {
      this.logger.info('Skip recap button found, clicking...');
      this.domAdapter.clickButton(skipRecapButton);
      return;
    }

    // Prioridade 3: Pular créditos
    const skipCreditsButton = this.domAdapter.findSkipCreditsButton();
    if (skipCreditsButton) {
      this.logger.info('Skip credits button found, clicking...');
      this.domAdapter.clickButton(skipCreditsButton);
      return;
    }
  }
}
