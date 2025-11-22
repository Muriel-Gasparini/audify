import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

export class VideoLifecycleObserver {
  private seekingListener: (() => void) | null = null;
  private playListener: (() => void) | null = null;
  private playingListener: (() => void) | null = null;
  private clickListener: (() => void) | null = null;
  private videoRemovalObserver: MutationObserver | null = null;
  private hasReceivedUserGesture: boolean = false;

  constructor(private readonly logger: ILogger) {}

  public observeVideo(
    video: HTMLVideoElement,
    onSeeking: () => void,
    onRemoved: () => void,
    onPlay?: () => void,
    onUserGesture?: () => void
  ): void {
    this.seekingListener = onSeeking;
    video.addEventListener('seeking', this.seekingListener);

    if (onPlay) {
      this.playListener = onPlay;
      this.playingListener = onPlay;
      video.addEventListener('play', this.playListener);
      video.addEventListener('playing', this.playingListener);
    }

    if (onUserGesture) {
      this.clickListener = () => {
        if (!this.hasReceivedUserGesture) {
          this.hasReceivedUserGesture = true;
          onUserGesture();
        }
      };
      document.addEventListener('click', this.clickListener, { once: false, capture: true });
    }

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
    if (video) {
      if (this.seekingListener) {
        video.removeEventListener('seeking', this.seekingListener);
        this.seekingListener = null;
      }
      if (this.playListener) {
        video.removeEventListener('play', this.playListener);
        this.playListener = null;
      }
      if (this.playingListener) {
        video.removeEventListener('playing', this.playingListener);
        this.playingListener = null;
      }
    }

    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, { capture: true });
      this.clickListener = null;
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
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, { capture: true });
      this.clickListener = null;
    }
    this.seekingListener = null;
    this.playListener = null;
    this.playingListener = null;
    this.hasReceivedUserGesture = false;
  }
}
