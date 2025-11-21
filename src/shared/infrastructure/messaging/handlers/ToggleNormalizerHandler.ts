import { CommandHandler } from '../commands/Command';
import { ToggleNormalizerCommand } from '../commands/ToggleNormalizerCommand';
import { ActivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/ActivateNormalizerUseCase';
import { DeactivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/DeactivateNormalizerUseCase';
import { IConfigRepository } from '../../storage/IConfigRepository';
import { ILogger } from '../../logger/ILogger';

/**
   * Handles normalizer toggle with deferred activation support.
   */
export class ToggleNormalizerHandler implements CommandHandler<ToggleNormalizerCommand, void> {
  constructor(
    private readonly activateUseCase: ActivateNormalizerUseCase,
    private readonly deactivateUseCase: DeactivateNormalizerUseCase,
    private readonly configRepository: IConfigRepository,
    private readonly logger: ILogger
  ) {}

  public async handle(_command: ToggleNormalizerCommand): Promise<void> {
    const config = await this.configRepository.load();
    const newIsActive = !config.isActive;

    this.logger.info(`Toggling normalizer: ${config.isActive} -> ${newIsActive}`);

    if (newIsActive) {
      const result = this.activateUseCase.execute();

      if (result.success) {
        this.logger.info('Normalizer activated immediately');
      } else if (result.reason === 'NO_VIDEO') {
        this.logger.info('Video not available yet - activation will be deferred');
      } else {
        this.logger.info('Normalizer was already active');
      }
    } else {
      this.deactivateUseCase.execute();
      this.logger.info('Normalizer deactivated');
    }

    await this.configRepository.update({ isActive: newIsActive });
    this.logger.info('Configuration updated successfully');
  }
}
