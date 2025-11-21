export class ChromeContextUtil {
  public static isExtensionContextValid(): boolean {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }
}
