import { CommandHandler } from '../commands/Command';
import { UpdateConfigCommand } from '../commands/UpdateConfigCommand';
import { UpdateAudioConfigUseCase } from '../../../../audio-normalization/application/use-cases/UpdateAudioConfigUseCase';
import { IConfigRepository } from '../../storage/IConfigRepository';

/**
   * Handles configuration update commands.
   */
export class UpdateConfigHandler implements CommandHandler<UpdateConfigCommand, void> {
  constructor(
    private readonly updateConfigUseCase: UpdateAudioConfigUseCase,
    private readonly configRepository: IConfigRepository
  ) {}

  public async handle(command: UpdateConfigCommand): Promise<void> {
    await this.updateConfigUseCase.execute(command.payload);

    if ('isActive' in command.payload) {
      await this.configRepository.update({
        isActive: (command.payload as any).isActive,
      });
    }
  }
}
