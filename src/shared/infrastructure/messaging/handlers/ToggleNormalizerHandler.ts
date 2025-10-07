import { CommandHandler } from '../commands/Command';
import { ToggleNormalizerCommand } from '../commands/ToggleNormalizerCommand';
import { ActivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/ActivateNormalizerUseCase';
import { DeactivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/DeactivateNormalizerUseCase';
import { IConfigRepository } from '../../storage/IConfigRepository';

/**
 * Handler: Toggle Normalizador
 */
export class ToggleNormalizerHandler implements CommandHandler<ToggleNormalizerCommand, void> {
  constructor(
    private readonly activateUseCase: ActivateNormalizerUseCase,
    private readonly deactivateUseCase: DeactivateNormalizerUseCase,
    private readonly configRepository: IConfigRepository
  ) {}

  public async handle(_command: ToggleNormalizerCommand): Promise<void> {
    const config = await this.configRepository.load();
    const newIsActive = !config.isActive;

    if (newIsActive) {
      this.activateUseCase.execute();
    } else {
      this.deactivateUseCase.execute();
    }

    await this.configRepository.update({ isActive: newIsActive });
  }
}
