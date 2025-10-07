import { MessageBus } from '../shared/infrastructure/messaging/MessageBus';
import { GetConfigCommand } from '../shared/infrastructure/messaging/commands/GetConfigCommand';
import { UpdateConfigCommand } from '../shared/infrastructure/messaging/commands/UpdateConfigCommand';
import { GetStateCommand } from '../shared/infrastructure/messaging/commands/GetStateCommand';
import { ToggleNormalizerCommand } from '../shared/infrastructure/messaging/commands/ToggleNormalizerCommand';
import { GetSiteInfoCommand } from '../shared/infrastructure/messaging/commands/GetSiteInfoCommand';
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
  private listener: ((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => boolean) | null = null;

  constructor(
    private readonly messageBus: MessageBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Inicia escuta de mensagens
   */
  public listen(): void {
    const isTopFrame = window.self === window.top;
    const frameInfo = isTopFrame ? 'TOP FRAME' : 'IFRAME';

    this.logger.info(`MessageRouter.listen() called in ${frameInfo} - registering chrome.runtime.onMessage listener`);

    this.listener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
      this.logger.info(`[${frameInfo}] Message received from ${sender.tab?.id || 'unknown'}:`, {
        type: message?.type || 'UNKNOWN',
        frameId: sender.frameId,
        url: sender.url
      });

      // CRITICAL: Handle async operations properly to avoid "Receiving end does not exist" error
      // Chrome requires that we handle the promise and call sendResponse within the promise chain
      // Using .then() ensures sendResponse is called in a trackable promise context
      this.handleMessage(message)
        .then((response) => {
          this.logger.info(`[${frameInfo}] Sending response for ${message?.type}:`, response);
          sendResponse(response);
        })
        .catch((error) => {
          this.logger.error(`[${frameInfo}] Error in message handler:`, error);
          sendResponse({ success: false, error: String(error) });
        });

      return true; // Mantém canal aberto para resposta assíncrona
    };

    chrome.runtime.onMessage.addListener(this.listener);

    this.logger.info(`[${frameInfo}] Message router listening - listener registered successfully`);
  }

  /**
   * Para a escuta de mensagens
   */
  public stopListening(): void {
    if (this.listener) {
      chrome.runtime.onMessage.removeListener(this.listener);
      this.listener = null;
      this.logger.info('Message router stopped listening');
    }
  }

  /**
   * Processa uma mensagem
   * IMPORTANT: Returns the response object instead of calling sendResponse directly
   * This allows the caller to handle sendResponse in a promise chain that Chrome can track
   */
  private async handleMessage(message: any): Promise<any> {
    const startTime = performance.now();

    this.logger.info(`[MessageRouter] Processing message type: ${message?.type}`);

    const command = this.messageToCommand(message);

    if (!command) {
      this.logger.warn(`[MessageRouter] Unknown message type: ${message?.type}`);
      return { success: false, error: 'Unknown message type' };
    }

    this.logger.info(`[MessageRouter] Dispatching command: ${command.type}`);
    const result = await this.messageBus.dispatch(command);

    const elapsed = (performance.now() - startTime).toFixed(2);
    this.logger.info(`[MessageRouter] Command ${command.type} handled successfully in ${elapsed}ms`);

    // Formato de resposta baseado no tipo de comando
    let response: any;
    if (command.type === 'GET_CONFIG') {
      response = { config: result };
    } else if (command.type === 'GET_STATE') {
      response = { state: result };
      console.log('[MessageRouter] GET_STATE - Preparing response with state:', result);
    } else if (command.type === 'GET_SITE_INFO') {
      response = { siteInfo: result };
    } else {
      response = { success: true };
    }

    this.logger.info(`[MessageRouter] Response prepared for ${command.type}:`, response);
    return response;
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

      case 'GET_SITE_INFO':
        return new GetSiteInfoCommand();

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
        return null;
    }
  }
}
