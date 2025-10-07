import { DomainEvent } from './DomainEvent';

/**
 * Tipo para funções que escutam eventos de domínio
 */
type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

/**
 * Publisher de eventos de domínio (Observer Pattern)
 *
 * Permite comunicação desacoplada entre diferentes partes do sistema
 * através de eventos de domínio
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

  /**
   * Registra um handler para um tipo específico de evento
   */
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

  /**
   * Remove um handler específico de um evento
   */
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

  /**
   * Publica um evento para todos os handlers registrados
   */
  public publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers || handlers.length === 0) return;

    // Executa handlers de forma síncrona
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventName}:`, error);
      }
    });
  }

  /**
   * Remove todos os handlers (útil para testes)
   */
  public clearAll(): void {
    this.handlers.clear();
  }

  /**
   * Remove todos os handlers de um evento específico
   */
  public clearEvent(eventName: string): void {
    this.handlers.delete(eventName);
  }
}
