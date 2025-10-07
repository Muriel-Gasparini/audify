import { Command } from './Command';

/**
 * Command: Obter Estado do Normalizador
 */
export class GetStateCommand implements Command {
  public readonly type = 'GET_STATE';
}
