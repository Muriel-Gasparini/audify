import { Command } from './Command';

/**
   * Toggles normalizer activation state.
   */
export class ToggleNormalizerCommand implements Command {
  public readonly type = 'TOGGLE_NORMALIZER';
}
