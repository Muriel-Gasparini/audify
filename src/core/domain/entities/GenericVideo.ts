/**
   * Generic video element entity for any site.
   */
export class GenericVideo {
  constructor(
    private readonly element: HTMLVideoElement,
    private readonly sourceContext: 'main' | 'iframe' = 'main',
    private readonly iframeOrigin?: string
  ) {}

  public isReady(): boolean {
    return this.element.readyState >= 2;
  }

  public getElement(): HTMLVideoElement {
    return this.element;
  }

  public isSameAs(element: HTMLVideoElement): boolean {
    return this.element === element;
  }

  public isInIframe(): boolean {
    return this.sourceContext === 'iframe';
  }

  public getIframeOrigin(): string | undefined {
    return this.iframeOrigin;
  }

  public isVisible(): boolean {
    const rect = this.element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  public getSrc(): string {
    return this.element.src || this.element.currentSrc || '';
  }
}
