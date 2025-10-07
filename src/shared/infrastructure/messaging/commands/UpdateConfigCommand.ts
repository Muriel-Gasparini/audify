import { Command } from './Command';

/**
 * Command: Atualizar Configuração
 */
export interface UpdateConfigPayload {
  targetLevel?: number;
  maxGain?: number;
  minGain?: number;
}

export class UpdateConfigCommand implements Command<UpdateConfigPayload> {
  public readonly type = 'UPDATE_CONFIG';

  constructor(public readonly payload: UpdateConfigPayload) {}
}
