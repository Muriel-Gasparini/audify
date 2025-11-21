import { GenericVideo } from '../domain/entities/GenericVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Generic DOM Adapter.
   */
export class GenericDOMAdapter {
  private static readonly VIDEO_SELECTOR = 'video';

  constructor(private readonly logger: ILogger) {}

  /**
   * Finds all videos in main document.
   */
  public findVideosInMainDocument(): GenericVideo[] {
    const videos: GenericVideo[] = [];
    const videoElements = document.querySelectorAll(GenericDOMAdapter.VIDEO_SELECTOR);

    videoElements.forEach((element) => {
      if (element instanceof HTMLVideoElement) {
        const video = new GenericVideo(element, 'main');
        videos.push(video);
      }
    });

    return videos;
  }

  /**
   * Finds all videos in same-origin iframes.
   */
  public findVideosInIframes(): GenericVideo[] {
    const videos: GenericVideo[] = [];
    const iframes = document.querySelectorAll('iframe');

    iframes.forEach((iframe) => {
      try {
        const iframeVideos = this.extractVideosFromIframe(iframe);
        videos.push(...iframeVideos);
      } catch (error) {
      }
    });

    return videos;
  }

  /**
   * Finds all videos (main + iframes).
   */
  public findAllVideos(): GenericVideo[] {
    const mainVideos = this.findVideosInMainDocument();
    const iframeVideos = this.findVideosInIframes();

    const allVideos = [...mainVideos, ...iframeVideos];

    if (allVideos.length > 0) {
      this.logger.debug(`Found ${allVideos.length} video(s): ${mainVideos.length} in main, ${iframeVideos.length} in iframes`);
    }

    return allVideos;
  }

  /**
   * Finds the first vídeo ready (prioritizes main, then iframes).
   */
  public findFirstReadyVideo(): GenericVideo | null {
    const mainVideos = this.findVideosInMainDocument();
    if (mainVideos.length > 0) {
      return mainVideos[0];
    }

    const iframeVideos = this.findVideosInIframes();
    if (iframeVideos.length > 0) {
      return iframeVideos[0];
    }

    return null;
  }

  /**
   * Extracts videos from specific iframe.
   */
  private extractVideosFromIframe(iframe: HTMLIFrameElement): GenericVideo[] {
    const videos: GenericVideo[] = [];

    try {
      const iframeDocument = this.getAccessibleIframeDocument(iframe);

      if (!iframeDocument) {
        return videos;
      }

      const videoElements = iframeDocument.querySelectorAll(GenericDOMAdapter.VIDEO_SELECTOR);

      videoElements.forEach((element) => {
        if (element instanceof HTMLVideoElement) {
          const origin = this.getIframeOrigin(iframe);
          const video = new GenericVideo(element, 'iframe', origin);

          videos.push(video);
        }
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        this.logger.debug('SecurityError accessing iframe - sandboxed or cross-origin');
      }
    }

    return videos;
  }

  /**
   * Gets origin of um iframe.
   */
  private getIframeOrigin(iframe: HTMLIFrameElement): string {
    try {
      if (iframe.src && iframe.src !== 'about:blank' && iframe.src !== 'about:srcdoc') {
        return iframe.src;
      }

      if (iframe.contentDocument) {
        try {
          const origin = iframe.contentWindow?.location.origin;
          if (origin && origin !== 'null') {
            return origin;
          }
        } catch {
        }
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Checks if video element exists no DOM.
   */
  public videoExistsInDOM(videoElement: HTMLVideoElement): boolean {
    return document.body.contains(videoElement) || this.videoExistsInIframes(videoElement);
  }

  /**
   * Checks if video exists em algum iframe.
   */
  private videoExistsInIframes(videoElement: HTMLVideoElement): boolean {
    const iframes = document.querySelectorAll('iframe');

    for (const iframe of iframes) {
      try {
        const iframeDocument = this.getAccessibleIframeDocument(iframe);
        if (iframeDocument && iframeDocument.body.contains(videoElement)) {
          return true;
        }
      } catch {
      }
    }

    return false;
  }

  /**
   * Safely attempts to get an accessible iframe document.
   */
  private getAccessibleIframeDocument(iframe: HTMLIFrameElement): Document | null {
    try {
      const doc = iframe.contentDocument;

      if (!doc) {
        return null;
      }

      try {
        const _ = doc.body;
        return doc;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }
}
