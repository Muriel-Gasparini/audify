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
  private static readonly RETRY_DELAY_MS = 150;
  private static readonly MESSAGE_TIMEOUT_MS = 2000;

  /**
   * @returns Whether the active tab is accessible by the extension
   */
  public async canAccessTab(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.url) {
          resolve(false);
          return;
        }
        const isRestrictedUrl = activeTab.url.startsWith('chrome://') ||
                                activeTab.url.startsWith('edge://') ||
                                activeTab.url.startsWith('about:');
        resolve(!isRestrictedUrl);
      });
    });
  }

  private async sendMessageToActiveTab<T>(message: any, retryCount = 0): Promise<T> {
    return Promise.race([
      new Promise<T>((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const activeTab = tabs[0];
          if (!activeTab?.id) {
            reject(new Error('No active tab found'));
            return;
          }

          chrome.tabs.sendMessage(
            activeTab.id,
            message,
            { frameId: 0 },
            async (response: T) => {
              const lastError = chrome.runtime.lastError;

              if (lastError) {
                const isConnectionError = lastError.message?.includes('Receiving end does not exist');

                if (isConnectionError && retryCount < PopupMessagingService.MAX_RETRIES) {
                  await this.delay(PopupMessagingService.RETRY_DELAY_MS * (retryCount + 1));

                  try {
                    const result = await this.sendMessageToActiveTab<T>(message, retryCount + 1);
                    resolve(result);
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  reject(new Error(lastError.message || 'Content script not available'));
                }
              } else {
                resolve(response);
              }
            }
          );
        });
      }),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Content script timeout')), PopupMessagingService.MESSAGE_TIMEOUT_MS)
      )
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @returns Current audio normalizer configuration
   * @throws Error if content script is not available or timeout occurs
   */
  public async getConfig(): Promise<AudioConfig> {
    const response = await this.sendMessageToActiveTab<{ config: AudioConfig }>({
      type: 'GET_CONFIG',
    });
    return response.config;
  }

  /**
   * @param partialConfig Partial configuration to update
   * @throws Error if content script is not available or timeout occurs
   */
  public async updateConfig(partialConfig: Partial<AudioConfig>): Promise<void> {
    await this.sendMessageToActiveTab<{ success: boolean }>({
      type: 'UPDATE_CONFIG',
      data: partialConfig,
    });
  }

  /**
   * @returns Current audio normalizer state
   * @throws Error if content script is not available or timeout occurs
   */
  public async getState(): Promise<AudioState> {
    const response = await this.sendMessageToActiveTab<{ state: AudioState }>({
      type: 'GET_STATE',
    });
    return response.state;
  }

  /**
   * @throws Error if content script is not available or timeout occurs
   */
  public async toggleNormalizer(): Promise<void> {
    await this.sendMessageToActiveTab<{ success: boolean }>({
      type: 'TOGGLE_NORMALIZER',
    });
  }

  /**
   * @returns Site-specific integration information
   * @throws Error if content script is not available or timeout occurs
   */
  public async getSiteInfo(): Promise<SiteInfo> {
    const response = await this.sendMessageToActiveTab<{ siteInfo: SiteInfo }>({
      type: 'GET_SITE_INFO',
    });
    return response.siteInfo;
  }

}
