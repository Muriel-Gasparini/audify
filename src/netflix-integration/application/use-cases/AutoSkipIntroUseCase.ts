import { AutoSkipService } from '../../infrastructure/AutoSkipService';

/**
   * Controls Netflix intro and recap auto-skip.
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
