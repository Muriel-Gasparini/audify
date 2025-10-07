/**
 * Interface base para Commands (Command Pattern)
 *
 * Commands encapsulam requisições como objetos
 */
export interface Command<T = unknown> {
  readonly type: string;
  readonly payload?: T;
}

/**
 * Interface para handlers de Commands
 */
export interface CommandHandler<TCommand extends Command, TResponse = unknown> {
  handle(command: TCommand): Promise<TResponse> | TResponse;
}
