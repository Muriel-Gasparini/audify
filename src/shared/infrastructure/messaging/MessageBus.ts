import { Command, CommandHandler } from './commands/Command';
import { ILogger } from '../logger/ILogger';

/**
 * Message Bus (Mediator Pattern)
 * Roteia comandos para seus handlers apropriados
 *
 * Responsabilidades:
 * - Registrar handlers para comandos
 * - Despachar comandos para handlers
 * - Gerenciar erros
 */
export class MessageBus {
  private handlers: Map<string, CommandHandler<any, any>> = new Map();

  constructor(private readonly logger: ILogger) {}

  /**
   * Registra um handler para um tipo de comando
   */
  public register<TCommand extends Command, TResponse>(
    commandType: string,
    handler: CommandHandler<TCommand, TResponse>
  ): void {
    if (this.handlers.has(commandType)) {
      this.logger.warn(`Handler for ${commandType} already registered, overwriting`);
    }

    this.handlers.set(commandType, handler);
    this.logger.debug(`Handler registered for ${commandType}`);
  }

  /**
   * Despacha um comando para seu handler
   */
  public async dispatch<TResponse>(command: Command): Promise<TResponse> {
    const handler = this.handlers.get(command.type);

    if (!handler) {
      const error = new Error(`No handler registered for command: ${command.type}`);
      this.logger.error('Command dispatch failed', error);
      throw error;
    }

    try {
      this.logger.debug(`Dispatching command: ${command.type}`);
      const result = await handler.handle(command);
      this.logger.debug(`Command handled successfully: ${command.type}`);
      return result;
    } catch (error) {
      this.logger.error(`Error handling command ${command.type}`, error);
      throw error;
    }
  }

  /**
   * Verifica se existe handler para um comando
   */
  public hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }

  /**
   * Remove todos os handlers (útil para testes)
   */
  public clearAll(): void {
    this.handlers.clear();
    this.logger.debug('All handlers cleared');
  }
}
