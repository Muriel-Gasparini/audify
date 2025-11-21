import { Command } from './Command';

/**
   * Gets normalizer state.
   */
export class GetStateCommand implements Command {
  public readonly type = 'GET_STATE';
}
