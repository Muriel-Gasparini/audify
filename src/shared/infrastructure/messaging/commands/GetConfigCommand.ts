import { Command } from './Command';

/**
   * Gets normalizer configuration.
   */
export class GetConfigCommand implements Command {
  public readonly type = 'GET_CONFIG';
}
