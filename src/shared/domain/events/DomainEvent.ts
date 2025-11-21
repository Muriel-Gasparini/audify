/**
   * Base interface for all domain events.
   */
export interface DomainEvent {
  readonly eventName: string;

  readonly occurredOn: Date;

  readonly payload: unknown;
}
