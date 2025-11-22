import { GenericDOMAdapter } from './GenericDOMAdapter';
import { GenericVideo } from '../domain/entities/GenericVideo';
import { IVideoDiscoveryObserver } from '../domain/services/IVideoDiscoveryObserver';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
   * Video Discovery Service.
   */
export class VideoDiscoveryService {
  private observer: MutationObserver | null = null;
  private retryInterval: number | null = null;
  private observers: IVideoDiscoveryObserver[] = [];
  private discoveredVideos = new WeakSet<HTMLVideoElement>();

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_MS = 100;

  private hasFoundVideo = false;

  constructor(
    private readonly domAdapter: GenericDOMAdapter,
    private readonly logger: ILogger
  ) {}

  /**
   * Registers an observer.
   */
  public addObserver(observer: IVideoDiscoveryObserver): void {
    this.observers.push(observer);
  }

  /**
   * Removes an observer.
   */
  public removeObserver(observer: IVideoDiscoveryObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Starts video discovery.
   */
  public startDiscovery(): void {
    this.tryDiscoverVideos(false, 'startDiscovery-initial');

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          if (mutation.target instanceof HTMLVideoElement) {
            const newSrc = mutation.target.src || mutation.target.currentSrc;
            if (newSrc && newSrc.trim().length > 0) {
              shouldCheck = true;
              break;
            }
          }
        }
      }

      if (shouldCheck) {
        this.tryDiscoverVideos(false, 'MutationObserver');
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    this.monitorIframes();

    this.logger.info('Video discovery service started');

    let elapsedTime = 0;
    const initialInterval = 2000;
    const slowInterval = 5000;
    const switchPoint = 10000;
    const maxDuration = 60000;

    const executeRetry = () => {
      this.tryDiscoverVideos(false, 'retryInterval');

      elapsedTime += this.hasFoundVideo ? slowInterval : initialInterval;

      if (elapsedTime >= maxDuration) {
        this.stopRetry();
        this.logger.info('Retry interval stopped after max duration');
        return;
      }

      const nextInterval = (elapsedTime >= switchPoint || this.hasFoundVideo) ? slowInterval : initialInterval;

      this.retryInterval = window.setTimeout(executeRetry, nextInterval);
    };

    this.retryInterval = window.setTimeout(executeRetry, initialInterval);
  }

  /**
   * Stops discovery.
   */
  public stopDiscovery(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.stopRetry();
    this.logger.info('Video discovery service stopped');
  }

  /**
   * Attempts to discover videos (debounced wrapper).
   * @param force If true, notifies observers even if video already discovered
   * @param caller Caller identifier for debug
   */
  private tryDiscoverVideos(force: boolean = false, caller: string = 'unknown'): void {
    if (!force) {
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        this.debounceTimer = null;
        this.tryDiscoverVideosImmediate(force, caller);
      }, this.DEBOUNCE_MS);
    } else {
      this.tryDiscoverVideosImmediate(force, caller);
    }
  }

  /**
   * Attempts to discover videos (immediate execution).
   * @param force If true, notifies observers even if video already discovered
   * @param caller Caller identifier for debug
   */
  private tryDiscoverVideosImmediate(force: boolean = false, _caller: string = 'unknown'): void {
    const videos = this.domAdapter.findAllVideos();

    videos.forEach((video) => {
      const element = video.getElement();
      const videoSrc = video.getSrc();
      const alreadyDiscovered = this.discoveredVideos.has(element);

      const hasValidSrc = videoSrc && videoSrc.trim().length > 0;
      if (!hasValidSrc) {
        return;
      }

      if (!alreadyDiscovered || force) {
        if (!alreadyDiscovered) {
          this.discoveredVideos.add(element);
          this.hasFoundVideo = true;
        }

        this.notifyVideoDiscovered(video);
      }
    });
  }

  /**
   * Monitors iframes being added to DOM.
   */
  private monitorIframes(): void {
    const iframeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLIFrameElement) {
            if (this.isSandboxedIframe(node) || this.isAboutBlank(node)) {
              return;
            }

            node.addEventListener('load', () => {
              if (!this.isSandboxedIframe(node) && !this.isAboutBlank(node)) {
                setTimeout(() => {
                  this.tryDiscoverVideos(false, 'iframeLoad');
                }, 100);
              }
            });
          }
        });
      }
    });

    iframeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Notifies observadores sobre vídeo descoberto.
   */
  private notifyVideoDiscovered(video: GenericVideo): void {
    this.logger.info(`Video discovered: ${video.isInIframe() ? 'iframe' : 'main'} context, src: ${video.getSrc()}`);

    this.observers.forEach((observer) => {
      try {
        observer.onVideoDiscovered(video);
      } catch (error) {
        this.logger.error('Error notifying observer', error);
      }
    });
  }

  /**
   * Stops retry interval/timeout.
   */
  private stopRetry(): void {
    if (this.retryInterval !== null) {
      clearTimeout(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Força uma nova busca por videos.
   */
  public forceDiscovery(): void {
    this.logger.info('Force discovery triggered');
    this.tryDiscoverVideos(true, 'forceDiscovery');
  }

  /**
   * Checks if an iframe is sandboxed and restricted.
   */
  private isSandboxedIframe(iframe: HTMLIFrameElement): boolean {
    try {
      if (iframe.hasAttribute('sandbox')) {
        const sandbox = iframe.getAttribute('sandbox') || '';
        return !sandbox.includes('allow-scripts') || !sandbox.includes('allow-same-origin');
      }
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Checks if an iframe points to about:blank or about:srcdoc.
   */
  private isAboutBlank(iframe: HTMLIFrameElement): boolean {
    try {
      const src = iframe.src;

      if (src === 'about:blank' || src === 'about:srcdoc' || src === '') {
        return true;
      }

      try {
        const href = iframe.contentWindow?.location?.href;
        return href === 'about:blank' || href === 'about:srcdoc';
      } catch {
        return false;
      }
    } catch {
      return true;
    }
  }
}
