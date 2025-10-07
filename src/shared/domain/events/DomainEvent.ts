/**
 * Interface base para todos os eventos de domínio
 *
 * Eventos de domínio representam fatos que aconteceram no domínio
 * e são importantes para o negócio
 */
export interface DomainEvent {
  /**
   * Nome único do evento
   */
  readonly eventName: string;

  /**
   * Timestamp de quando o evento ocorreu
   */
  readonly occurredOn: Date;

  /**
   * Payload do evento (dados específicos)
   */
  readonly payload: unknown;
}
