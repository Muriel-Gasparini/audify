import { Command } from './Command';

/**
   * Gets current site integration information.
   */
export class GetSiteInfoCommand implements Command {
  public readonly type = 'GET_SITE_INFO';
}
