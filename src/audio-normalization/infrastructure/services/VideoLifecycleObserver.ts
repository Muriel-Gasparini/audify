import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export class VideoLifecycleObserver {
  private seekingListener: (() => void) | null = null;
  private videoRemovalObserver: MutationObserver | null = null;

  constructor(private readonly logger: ILogger) {}

  public observeVideo(
    video: HTMLVideoElement,
    onSeeking: () => void,
    onRemoved: () => void
  ): void {
    this.seekingListener = onSeeking;
    video.addEventListener('seeking', this.seekingListener);

    this.videoRemovalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === video || (node instanceof Element && node.contains(video))) {
            this.logger.warn('VIDEO REMOVED FROM DOM!', {
              videoSrc: video.src || video.currentSrc,
            });
            this.logger.warn('Video element removed from DOM');
            this.cleanup();
            onRemoved();
            return;
          }
        }
      }
    });

    if (video.parentElement) {
      this.videoRemovalObserver.observe(video.parentElement, { childList: true });
    }
  }

  public removeListeners(video: HTMLVideoElement | null): void {
    if (video && this.seekingListener) {
      video.removeEventListener('seeking', this.seekingListener);
      this.seekingListener = null;
    }

    if (this.videoRemovalObserver) {
      this.videoRemovalObserver.disconnect();
      this.videoRemovalObserver = null;
    }
  }

  public cleanup(): void {
    if (this.videoRemovalObserver) {
      this.videoRemovalObserver.disconnect();
      this.videoRemovalObserver = null;
    }
    this.seekingListener = null;
  }
}
