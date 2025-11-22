import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * CORS Bypass Service.
   */
export class CORSBypassService {
  private observer: MutationObserver | null = null;
  private processedVideos = new WeakSet<HTMLVideoElement>();

  constructor(private readonly logger: ILogger) {}

  /**
   * Starts video monitoring.
   */
  public start(): void {
    this.processExistingVideos();

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.processNode(node);
          });
        } else if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target instanceof HTMLVideoElement && mutation.attributeName === 'src') {
            this.processVideo(target);
          }
        }
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    this.logger.info('CORS bypass service started');
  }

  /**
   * Stops monitoring.
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.logger.info('CORS bypass service stopped');
  }

  /**
   * Processes existing videos in DOM.
   */
  private processExistingVideos(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement) {
        this.processVideo(video);
      }
    });

    this.processIframeVideos(document);
  }

  /**
   * Processes node and descendants.
   */
  private processNode(node: Node): void {
    if (node instanceof HTMLVideoElement) {
      this.processVideo(node);
    } else if (node instanceof HTMLElement) {
      const videos = node.querySelectorAll('video');
      videos.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          this.processVideo(video);
        }
      });
    } else if (node instanceof HTMLIFrameElement) {
      this.processIframeVideos(node);
    }
  }

  /**
   * Processes videos inside iframes (same-origin only).
   */
  private processIframeVideos(context: Document | HTMLIFrameElement): void {
    try {
      let iframeDocument: Document | null = null;

      if (context instanceof HTMLIFrameElement) {
        iframeDocument = this.getAccessibleIframeDocument(context);

        if (!iframeDocument) {
          return;
        }
      } else {
        const iframes = context.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          const doc = this.getAccessibleIframeDocument(iframe);
          if (doc) {
            this.processIframeVideos(iframe);
          }
        });
        return;
      }

      if (!iframeDocument) return;

      const videos = iframeDocument.querySelectorAll('video');
      videos.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          this.processVideo(video);
        }
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        this.logger.debug('SecurityError in CORS bypass - sandboxed or cross-origin iframe');
      }
    }
  }

  private processVideo(video: HTMLVideoElement): void {
    if (this.processedVideos.has(video)) {
      return;
    }

    try {
      if (video.crossOrigin) {
        this.processedVideos.add(video);
        return;
      }

      const hadSrc = video.src || video.currentSrc;

      video.crossOrigin = 'anonymous';
      this.processedVideos.add(video);

      if (hadSrc) {
        this.logger.debug('Added crossOrigin to video (already had src, may need reload)');
      } else {
        this.logger.debug('Added crossOrigin to video (before src set)');
      }

      if (hadSrc && video.readyState === 0 && video.networkState <= 2) {
        const currentSrc = video.src;
        video.removeAttribute('src');
        video.load();
        video.src = currentSrc;
        this.logger.debug('Reloaded video with crossOrigin');
      }
    } catch (error) {
      this.logger.debug('Error processing video for CORS bypass', error);
    }
  }

  /**
   * Attempts CORS bypass on specific video.
   */
  public applyCORSBypass(video: HTMLVideoElement): void {
    this.processVideo(video);
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
        void doc.body;
        return doc;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }
}
