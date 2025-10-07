/**
 * Entity: NetflixVideo
 * Representa um elemento de vídeo do Netflix
 *
 * Responsabilidades:
 * - Encapsular o elemento de vídeo HTML
 * - Validar estado do vídeo
 */
export class NetflixVideo {
  constructor(private readonly element: HTMLVideoElement) {}

  /**
   * Verifica se o vídeo está pronto (tem dados carregados)
   */
  public isReady(): boolean {
    return this.element.readyState >= 2; // HAVE_CURRENT_DATA ou superior
  }

  /**
   * Obtém o elemento nativo
   */
  public getElement(): HTMLVideoElement {
    return this.element;
  }

  /**
   * Verifica se é o mesmo vídeo
   */
  public isSameAs(element: HTMLVideoElement): boolean {
    return this.element === element;
  }
}
