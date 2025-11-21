import { DomainEvent } from './DomainEvent';

/**
   * Normalizer activation state changed domain event.
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
