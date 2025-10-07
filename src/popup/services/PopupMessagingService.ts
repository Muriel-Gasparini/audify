/**
 * Popup Messaging Service
 * Serviço para comunicação entre popup e content script
 */

export interface AudioState {
  gain: number;
  volume: number;
  isActive: boolean;
  hasVideo: boolean;
}

export interface AudioConfig {
  targetLevel: number;
  maxGain: number;
  minGain: number;
  isActive: boolean;
}

export interface SiteInfo {
  hasIntegration: boolean;
  integrationName: string | null;
}

export class PopupMessagingService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 100;

  /**
   * Verifica se a aba ativa está acessível para a extensão
   */
  public async canAccessTab(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.url) {
          resolve(false);
          return;
        }
        // Verifica se não é uma página protegida (chrome://, edge://, etc)
        const isRestrictedUrl = activeTab.url.startsWith('chrome://') ||
                                activeTab.url.startsWith('edge://') ||
                                activeTab.url.startsWith('about:');
        resolve(!isRestrictedUrl);
      });
    });
  }

  /**
   * Envia mensagem para a aba ativa com retry logic
   * IMPORTANTE: Envia para TODOS os frames (all_frames: true no manifest)
   * porque o content script pode estar em um iframe
   */
  private async sendMessageToActiveTab<T>(message: any, retryCount = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        // Envia para TODOS os frames, não apenas o frame principal
        // Isso é necessário porque o content script pode estar em um iframe
        chrome.tabs.sendMessage(
          activeTab.id,
          message,
          { frameId: undefined }, // undefined = todos os frames
          async (response: T) => {
            const lastError = chrome.runtime.lastError;

            if (lastError) {
              // "Receiving end does not exist" significa que o content script ainda não carregou
              const isConnectionError = lastError.message?.includes('Receiving end does not exist');

              if (isConnectionError && retryCount < PopupMessagingService.MAX_RETRIES) {
                console.log(`[PopupMessaging] Content script not ready, retrying... (${retryCount + 1}/${PopupMessagingService.MAX_RETRIES})`);

                // Aguarda um pouco e tenta novamente
                await this.delay(PopupMessagingService.RETRY_DELAY_MS * (retryCount + 1));

                try {
                  const result = await this.sendMessageToActiveTab<T>(message, retryCount + 1);
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              } else {
                // Erro diferente ou excedeu tentativas
                console.error('[PopupMessaging] Failed to send message:', lastError.message);
                reject(new Error(lastError.message || 'Failed to communicate with content script'));
              }
            } else {
              resolve(response);
            }
          }
        );
      });
    });
  }

  /**
   * Helper para adicionar delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém a configuração atual
   */
  public async getConfig(): Promise<AudioConfig> {
    const response = await this.sendMessageToActiveTab<{ config: AudioConfig }>({
      type: 'GET_CONFIG',
    });
    return response.config;
  }

  /**
   * Atualiza a configuração
   */
  public async updateConfig(partialConfig: Partial<AudioConfig>): Promise<void> {
    await this.sendMessageToActiveTab<{ success: boolean }>({
      type: 'SET_CONFIG',
      data: partialConfig,
    });
  }

  /**
   * Obtém o estado atual do normalizador
   */
  public async getState(): Promise<AudioState> {
    console.log('[PopupMessagingService] Sending GET_STATE message...');
    const response = await this.sendMessageToActiveTab<{ state: AudioState }>({
      type: 'GET_STATE',
    });
    console.log('[PopupMessagingService] Received GET_STATE response:', response);
    return response.state;
  }

  /**
   * Toggle (ativa/desativa) o normalizador
   */
  public async toggleNormalizer(): Promise<void> {
    await this.sendMessageToActiveTab<{ success: boolean }>({
      type: 'TOGGLE_NORMALIZER',
    });
  }

  /**
   * Obtém informações sobre integração específica do site
   */
  public async getSiteInfo(): Promise<SiteInfo> {
    const response = await this.sendMessageToActiveTab<{ siteInfo: SiteInfo }>({
      type: 'GET_SITE_INFO',
    });
    return response.siteInfo;
  }

}
