import { ISiteIntegration } from './ISiteIntegration';
import { ILogger } from '../shared/infrastructure/logger/ILogger';

/**
 * Site Integration Registry
 * Gerencia integrações OPCIONAIS específicas de sites
 *
 * IMPORTANTE:
 * - Integrações são OPCIONAIS, não obrigatórias
 * - Sites SEM integração funcionam normalmente (normalização de áudio genérica)
 * - Sites COM integração ganham features extras (ex: Netflix auto-skip)
 *
 * Responsabilidades:
 * - Registrar integrações opcionais
 * - Ativar integração específica se disponível para o hostname atual
 * - Fornecer acesso à integração ativa (pode ser null)
 */
export class SiteIntegrationRegistry {
  private integrations: Map<string, ISiteIntegration> = new Map();
  private activeIntegration: ISiteIntegration | null = null;

  constructor(private readonly logger: ILogger) {}

  /**
   * Registra uma integração
   */
  public register(integration: ISiteIntegration): void {
    const name = integration.getName();
    this.integrations.set(name, integration);

    this.logger.debug(`Registered site integration: ${name}`);
  }

  /**
   * Ativa a integração apropriada para o hostname atual
   *
   * IMPORTANTE:
   * - Se NÃO encontrar integração: funciona normalmente em modo genérico
   * - Se ENCONTRAR integração: ativa features específicas do site
   * - A ausência de integração NÃO impede o funcionamento básico
   */
  public activateForCurrentSite(): void {
    const hostname = window.location.hostname;

    for (const [name, integration] of this.integrations) {
      const supportedHostnames = integration.getSupportedHostnames();

      // Verifica se o hostname atual está na lista de suportados
      const isSupported = supportedHostnames.some((supported) => {
        // Suporta wildcard: *.netflix.com matches www.netflix.com
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

    // Não ter integração é normal e esperado para a maioria dos sites
    this.logger.info(`No site-specific integration for ${hostname} - using generic mode (audio normalization only)`);
  }

  /**
   * Obtém a integração ativa (se houver)
   */
  public getActiveIntegration(): ISiteIntegration | null {
    return this.activeIntegration;
  }

  /**
   * Verifica se há uma integração ativa
   */
  public hasActiveIntegration(): boolean {
    return this.activeIntegration !== null;
  }

  /**
   * Limpa todas as integrações
   */
  public cleanup(): void {
    if (this.activeIntegration) {
      this.activeIntegration.cleanup();
      this.activeIntegration = null;
    }

    this.integrations.clear();
    this.logger.debug('Site integration registry cleaned up');
  }
}
