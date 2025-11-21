import { ISiteIntegration } from './ISiteIntegration';
import { ILogger } from '../shared/infrastructure/logger/ILogger';

/**
   * Manages optional site-specific integrations.
   */
export class SiteIntegrationRegistry {
  private integrations: Map<string, ISiteIntegration> = new Map();
  private activeIntegration: ISiteIntegration | null = null;

  constructor(private readonly logger: ILogger) {}

  public register(integration: ISiteIntegration): void {
    const name = integration.getName();
    this.integrations.set(name, integration);

    this.logger.debug(`Registered site integration: ${name}`);
  }

  public activateForCurrentSite(): void {
    const hostname = window.location.hostname;

    for (const [name, integration] of this.integrations) {
      const supportedHostnames = integration.getSupportedHostnames();

      const isSupported = supportedHostnames.some((supported) => {
        if (supported.startsWith('*.')) {
          const domain = supported.substring(2);
          return hostname.endsWith(domain);
        }
        return hostname === supported || hostname.endsWith('.' + supported);
      });

      if (isSupported) {
        this.activeIntegration = integration;
        integration.initialize();
        this.logger.info(`Activated site-specific integration: ${name} for ${hostname}`);
        return;
      }
    }

    this.logger.info(`No site-specific integration for ${hostname} - using generic mode (audio normalization only)`);
  }

  public getActiveIntegration(): ISiteIntegration | null {
    return this.activeIntegration;
  }

  public hasActiveIntegration(): boolean {
    return this.activeIntegration !== null;
  }

  public cleanup(): void {
    if (this.activeIntegration) {
      this.activeIntegration.cleanup();
      this.activeIntegration = null;
    }

    this.integrations.clear();
    this.logger.debug('Site integration registry cleaned up');
  }
}
