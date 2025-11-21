import { DomainEvent } from './DomainEvent';

/**
   * Normalizer configuration changed domain event.
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
