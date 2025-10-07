import { MessageBus } from '../shared/infrastructure/messaging/MessageBus';
import { GetConfigCommand } from '../shared/infrastructure/messaging/commands/GetConfigCommand';
import { UpdateConfigCommand } from '../shared/infrastructure/messaging/commands/UpdateConfigCommand';
import { GetStateCommand } from '../shared/infrastructure/messaging/commands/GetStateCommand';
import { ToggleNormalizerCommand } from '../shared/infrastructure/messaging/commands/ToggleNormalizerCommand';
import { ILogger } from '../shared/infrastructure/logger/ILogger';

/**
 * Message Router
 * Roteia mensagens do Chrome Runtime para o Message Bus
 *
 * Responsabilidades:
 * - Escutar mensagens do chrome.runtime
 * - Converter mensagens para Commands
 * - Despachar via Message Bus
 * - Enviar respostas
 */
export class MessageRouter {
  constructor(
    private readonly messageBus: MessageBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Inicia escuta de mensagens
   */
  public listen(): void {
    this.logger.info('MessageRouter.listen() called - registering chrome.runtime.onMessage listener');

    chrome.runtime.onMessage.addListener(
      (message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
        this.logger.info(`Message received: ${message?.type || 'UNKNOWN'}`);
        this.handleMessage(message, sendResponse);
        return true; // Mantém canal aberto para resposta assíncrona
      }
    );

    this.logger.info('Message router listening - listener registered successfully');
  }

  /**
   * Processa uma mensagem
   */
  private async handleMessage(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const command = this.messageToCommand(message);

      if (!command) {
        sendResponse({ success: false, error: 'Unknown message type' });
        return;
      }

      const result = await this.messageBus.dispatch(command);

      // Formato de resposta baseado no tipo de comando
      if (command.type === 'GET_CONFIG') {
        sendResponse({ config: result });
      } else if (command.type === 'GET_STATE') {
        sendResponse({ state: result });
      } else {
        sendResponse({ success: true });
      }
    } catch (error) {
      this.logger.error('Error handling message', error);
      sendResponse({ success: false, error: String(error) });
    }
  }

  /**
   * Converte mensagem do Chrome Runtime para Command
   */
  private messageToCommand(message: any): any {
    switch (message.type) {
      case 'GET_CONFIG':
        return new GetConfigCommand();

      case 'SET_CONFIG':
      case 'UPDATE_CONFIG':
        return new UpdateConfigCommand(message.data);

      case 'GET_STATE':
        return new GetStateCommand();

      case 'TOGGLE_NORMALIZER':
        return new ToggleNormalizerCommand();

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
        return null;
    }
  }
}
