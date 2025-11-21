import { CommandHandler } from '../commands/Command';
import { GetSiteInfoCommand } from '../commands/GetSiteInfoCommand';
import { SiteIntegrationRegistry } from '../../../../site-integrations/SiteIntegrationRegistry';

/**
   * Site integration information DTO.
   */
export interface SiteInfoDTO {
  hasIntegration: boolean;
  integrationName: string | null;
}

/**
   * Handles site info retrieval commands.
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
