import { DomainEvent } from './DomainEvent';

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

/**
   * Domain event publisher using observer pattern.
   */
export class DomainEventPublisher {
  private static instance: DomainEventPublisher;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher();
    }
    return DomainEventPublisher.instance;
  }

  public subscribe<T extends DomainEvent>(
    eventName: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const handlers = this.handlers.get(eventName)!;
    handlers.push(handler as EventHandler);
  }

  public unsubscribe<T extends DomainEvent>(
    eventName: string,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    const index = handlers.indexOf(handler as EventHandler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  public publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers || handlers.length === 0) return;

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventName}:`, error);
      }
    });
  }

  public clearAll(): void {
    this.handlers.clear();
  }

  public clearEvent(eventName: string): void {
    this.handlers.delete(eventName);
  }
}
