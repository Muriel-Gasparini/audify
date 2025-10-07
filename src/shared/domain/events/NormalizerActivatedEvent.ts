import { DomainEvent } from './DomainEvent';

/**
 * Evento: Normalizador foi ativado ou desativado
 */
export interface NormalizerActivatedPayload {
  isActive: boolean;
}

export class NormalizerActivatedEvent implements DomainEvent {
  public readonly eventName = 'normalizer.activated';
  public readonly occurredOn: Date;
  public readonly payload: NormalizerActivatedPayload;

  constructor(isActive: boolean) {
    this.occurredOn = new Date();
    this.payload = { isActive };
  }
}
