/**
   * Netflix video element entity.
   */
export class NetflixVideo {
  constructor(private readonly element: HTMLVideoElement) {}

  public isReady(): boolean {
    return this.element.readyState >= 2;
  }

  public getElement(): HTMLVideoElement {
    return this.element;
  }

  public isSameAs(element: HTMLVideoElement): boolean {
    return this.element === element;
  }
}
