import { Command } from './Command';

/**
 * Command: Obter Configuração
 */
export class GetConfigCommand implements Command {
  public readonly type = 'GET_CONFIG';
}
