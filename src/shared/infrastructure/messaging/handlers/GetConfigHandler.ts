import { CommandHandler } from '../commands/Command';
import { GetConfigCommand } from '../commands/GetConfigCommand';
import { IConfigRepository } from '../../storage/IConfigRepository';
import { AudioConfig } from '../../../../audio-normalization/domain/value-objects/AudioConfig';

export class GetConfigHandler implements CommandHandler<GetConfigCommand, ReturnType<AudioConfig['toPrimitives']>> {
  constructor(private readonly configRepository: IConfigRepository) {}

  public async handle(_command: GetConfigCommand): Promise<ReturnType<AudioConfig['toPrimitives']>> {
    const config = await this.configRepository.load();
    return config.toPrimitives();
  }
}
