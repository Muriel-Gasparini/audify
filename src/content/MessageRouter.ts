import { MessageBus } from '../shared/infrastructure/messaging/MessageBus';
import { GetConfigCommand } from '../shared/infrastructure/messaging/commands/GetConfigCommand';
import { UpdateConfigCommand } from '../shared/infrastructure/messaging/commands/UpdateConfigCommand';
import { GetStateCommand } from '../shared/infrastructure/messaging/commands/GetStateCommand';
import { ToggleNormalizerCommand } from '../shared/infrastructure/messaging/commands/ToggleNormalizerCommand';
import { GetSiteInfoCommand } from '../shared/infrastructure/messaging/commands/GetSiteInfoCommand';
import { ILogger } from '../shared/infrastructure/logger/ILogger';
import { ChromeContextUtil } from '../shared/infrastructure/chrome/ChromeContextUtil';

/**
   * Message Router.
   */
export class MessageRouter {
  private listener: ((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => boolean) | null = null;

  constructor(
    private readonly messageBus: MessageBus,
    private readonly logger: ILogger
  ) {}

  public listen(): void {
    if (!this.isExtensionContextValid()) {
      this.logger.error('Cannot register message listener - extension context invalidated');
      return;
    }

    const isTopFrame = window.self === window.top;
    const frameInfo = isTopFrame ? 'TOP FRAME' : 'IFRAME';

    this.logger.info(`MessageRouter.listen() called in ${frameInfo} - registering chrome.runtime.onMessage listener`);

    this.listener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
      this.logger.info(`[${frameInfo}] Message received from ${sender.tab?.id || 'unknown'}:`, {
        type: message?.type || 'UNKNOWN',
        frameId: sender.frameId,
        url: sender.url
      });

      this.handleMessage(message)
        .then((response) => {
          this.logger.info(`[${frameInfo}] Sending response for ${message?.type}:`, response);
          sendResponse(response);
        })
        .catch((error) => {
          this.logger.error(`[${frameInfo}] Error in message handler:`, error);
          sendResponse({ success: false, error: String(error) });
        });

      return true;
    };

    chrome.runtime.onMessage.addListener(this.listener);

    this.logger.info(`[${frameInfo}] Message router listening - listener registered successfully`);
  }

  public stopListening(): void {
    if (this.listener) {
      try {
        if (this.isExtensionContextValid()) {
          chrome.runtime.onMessage.removeListener(this.listener);
        }
      } catch (error) {
        this.logger.warn('Failed to remove message listener (extension context may be invalid)', error);
      }
      this.listener = null;
      this.logger.info('Message router stopped listening');
    }
  }

  /**
   * Processes uma mensagem.
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

    let response: any;
    if (command.type === 'GET_CONFIG') {
      response = { config: result };
    } else if (command.type === 'GET_STATE') {
      response = { state: result };
      this.logger.debug('GET_STATE - Preparing response with state:', result);
    } else if (command.type === 'GET_SITE_INFO') {
      response = { siteInfo: result };
    } else {
      response = { success: true };
    }

    this.logger.info(`[MessageRouter] Response prepared for ${command.type}:`, response);
    return response;
  }

  /**
   * Converte mensagem do Chrome Runtime Stops Command.
   */
  private messageToCommand(message: any): any {
    switch (message.type) {
      case 'GET_CONFIG':
        return new GetConfigCommand();

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

  private isExtensionContextValid(): boolean {
    return ChromeContextUtil.isExtensionContextValid();
  }
}
