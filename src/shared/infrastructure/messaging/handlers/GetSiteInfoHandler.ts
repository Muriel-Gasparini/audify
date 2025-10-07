import { CommandHandler } from '../commands/Command';
import { GetSiteInfoCommand } from '../commands/GetSiteInfoCommand';
import { SiteIntegrationRegistry } from '../../../../site-integrations/SiteIntegrationRegistry';

/**
 * DTO: Site Info
 * Informações sobre integração específica do site
 */
export interface SiteInfoDTO {
  hasIntegration: boolean;
  integrationName: string | null;
}

/**
 * Handler: Get Site Info
 * Retorna informações sobre integração específica ativa
 */
export class GetSiteInfoHandler implements CommandHandler<GetSiteInfoCommand, SiteInfoDTO> {
  constructor(private readonly integrationRegistry: SiteIntegrationRegistry) {}

  public handle(_command: GetSiteInfoCommand): SiteInfoDTO {
    const activeIntegration = this.integrationRegistry.getActiveIntegration();

    return {
      hasIntegration: activeIntegration !== null,
      integrationName: activeIntegration?.getName() ?? null,
    };
  }
}
