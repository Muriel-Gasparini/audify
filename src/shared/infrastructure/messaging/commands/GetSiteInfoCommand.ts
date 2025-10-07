import { Command } from './Command';

/**
 * Command: Get Site Info
 * Obtém informações sobre integração específica do site atual
 */
export class GetSiteInfoCommand implements Command {
  public readonly type = 'GET_SITE_INFO';
}
