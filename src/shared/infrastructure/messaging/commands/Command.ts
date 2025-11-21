/**
   * Base command interface for command pattern.
   */
export interface Command<T = unknown> {
  readonly type: string;
  readonly payload?: T;
}

/**
   * Command handler interface.
   */
export interface CommandHandler<TCommand extends Command, TResponse = unknown> {
  handle(command: TCommand): Promise<TResponse> | TResponse;
}
