import { CommandHandler } from '../commands/Command';
import { UpdateConfigCommand } from '../commands/UpdateConfigCommand';
import { UpdateAudioConfigUseCase } from '../../../../audio-normalization/application/use-cases/UpdateAudioConfigUseCase';
import { AudioConfigDTO } from '../../../../audio-normalization/application/dto/AudioConfigDTO';

export class UpdateConfigHandler implements CommandHandler<UpdateConfigCommand, void> {
  constructor(private readonly updateConfigUseCase: UpdateAudioConfigUseCase) {}

  public async handle(command: UpdateConfigCommand): Promise<void> {
    const payload = command.payload as Partial<AudioConfigDTO>;
    await this.updateConfigUseCase.execute(payload);
  }
}
