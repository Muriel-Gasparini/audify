import { CommandHandler } from '../commands/Command';
import { GetStateCommand } from '../commands/GetStateCommand';
import { GetAudioStateUseCase } from '../../../../audio-normalization/application/use-cases/GetAudioStateUseCase';
import { AudioStateDTO } from '../../../../audio-normalization/application/dto/AudioStateDTO';

/**
   * Handles state retrieval commands.
   */
export class GetStateHandler implements CommandHandler<GetStateCommand, AudioStateDTO> {
  constructor(private readonly getStateUseCase: GetAudioStateUseCase) {}

  public handle(_command: GetStateCommand): AudioStateDTO {
    const state = this.getStateUseCase.execute();
    return state;
  }
}
