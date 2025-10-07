/**
 * Interface de Logger (Port - Hexagonal Architecture)
 *
 * Permite trocar a implementação de logging sem afetar o domínio
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error | unknown, ...args: unknown[]): void;
}
