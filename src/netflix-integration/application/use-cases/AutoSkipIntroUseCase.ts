import { AutoSkipService } from '../../infrastructure/AutoSkipService';

/**
 * Use Case: Auto Skip de Aberturas
 *
 * Responsabilidade:
 * - Iniciar/parar auto-skip de aberturas e recaps
 */
export class AutoSkipIntroUseCase {
  constructor(private readonly autoSkipService: AutoSkipService) {}

  public start(): void {
    this.autoSkipService.start();
  }

  public stop(): void {
    this.autoSkipService.stop();
  }
}
