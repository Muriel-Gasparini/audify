import { CommandHandler } from '../commands/Command';
import { GetConfigCommand } from '../commands/GetConfigCommand';
import { IConfigRepository, NormalizerConfig } from '../../storage/IConfigRepository';

/**
 * Handler: Obter Configuração
 */
export class GetConfigHandler implements CommandHandler<GetConfigCommand, NormalizerConfig> {
  constructor(private readonly configRepository: IConfigRepository) {}

  public async handle(_command: GetConfigCommand): Promise<NormalizerConfig> {
    return await this.configRepository.load();
  }
}
