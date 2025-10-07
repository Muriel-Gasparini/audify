import { Command } from './Command';

/**
 * Command: Toggle (Ativar/Desativar) Normalizador
 */
export class ToggleNormalizerCommand implements Command {
  public readonly type = 'TOGGLE_NORMALIZER';
}
