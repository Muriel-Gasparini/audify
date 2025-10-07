/**
 * Entity: GenericVideo
 * Representa um elemento de vídeo genérico (qualquer site)
 *
 * Responsabilidades:
 * - Encapsular o elemento de vídeo HTML
 * - Validar estado do vídeo
 * - Fornecer abstração genérica independente de site
 */
export class GenericVideo {
  constructor(
    private readonly element: HTMLVideoElement,
    private readonly sourceContext: 'main' | 'iframe' = 'main',
    private readonly iframeOrigin?: string
  ) {}

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

  /**
   * Verifica se o vídeo está em um iframe
   */
  public isInIframe(): boolean {
    return this.sourceContext === 'iframe';
  }

  /**
   * Obtém a origem do iframe (se aplicável)
   */
  public getIframeOrigin(): string | undefined {
    return this.iframeOrigin;
  }

  /**
   * Verifica se o vídeo está visível e tem dimensões
   */
  public isVisible(): boolean {
    const rect = this.element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Obtém o src do vídeo
   */
  public getSrc(): string {
    return this.element.src || this.element.currentSrc || '';
  }
}
