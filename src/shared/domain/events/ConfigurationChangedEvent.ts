import { DomainEvent } from './DomainEvent';

/**
 * Evento: Configuração do normalizador foi alterada
 *
 * Disparado quando qualquer configuração (targetLevel, maxGain, minGain) é modificada
 */
export interface ConfigurationChangedPayload {
  targetLevel?: number;
  maxGain?: number;
  minGain?: number;
  isActive?: boolean;
}

export class ConfigurationChangedEvent implements DomainEvent {
  public readonly eventName = 'configuration.changed';
  public readonly occurredOn: Date;
  public readonly payload: ConfigurationChangedPayload;

  constructor(payload: ConfigurationChangedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
