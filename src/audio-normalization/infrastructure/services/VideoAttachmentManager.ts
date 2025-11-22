import { WebAudioAdapter } from '../web-audio/WebAudioAdapter';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { VideoLifecycleObserver } from './VideoLifecycleObserver';

export class VideoAttachmentManager {
  private currentVideo: HTMLVideoElement | null = null;

  constructor(
    private readonly adapter: WebAudioAdapter,
    private readonly lifecycleObserver: VideoLifecycleObserver,
    private readonly logger: ILogger
  ) {}

  public attachToVideo(
    video: HTMLVideoElement,
    isNormalizerActive: boolean,
    onSeeking: () => void,
    onVideoRemoved: () => void,
    onPlay?: () => void,
    onUserGesture?: () => void
  ): void {
    if (this.currentVideo === video && this.adapter.isInitialized()) {
      this.logger.info('Already attached to this video');
      return;
    }

    this.logger.info('Attaching to video element');

    if (this.currentVideo !== video) {
      this.detachFromCurrentVideo();
    }

    this.currentVideo = video;

    try {
      this.adapter.attachToVideo(video);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isSourceNodeConflict = errorMessage.includes('already has') ||
                                   errorMessage.includes('MediaElementAudioSourceNode') ||
                                   errorMessage.includes('already being used');

      if (isSourceNodeConflict) {
        this.logger.warn('MediaElementSource conflict - attempting recovery');

        try {
          this.adapter.cleanup();
          this.adapter.attachToVideo(video);
          this.logger.info('Successfully attached after conflict recovery');
        } catch (retryError) {
          this.logger.error('Failed to attach after cleanup', retryError);
          this.currentVideo = null;
          throw retryError;
        }
      } else {
        this.logger.error('Failed to attach adapter to video', error);
        this.currentVideo = null;
        throw error;
      }
    }

    this.adapter.setActive(isNormalizerActive);
    this.lifecycleObserver.observeVideo(video, onSeeking, onVideoRemoved, onPlay, onUserGesture);
  }

  public detachFromCurrentVideo(): void {
    this.lifecycleObserver.removeListeners(this.currentVideo);

    if (this.adapter.isInitialized()) {
      this.adapter.setActive(false);
    }

    this.currentVideo = null;
    this.logger.info('Soft detached from video');
  }

  public hasVideoAttached(): boolean {
    const hasVideo = this.currentVideo !== null;
    const hasMediaElement = this.adapter.hasMediaElement();
    const isVideoInDOM = this.currentVideo?.isConnected ?? false;

    if (hasVideo && !isVideoInDOM) {
      this.logger.warn('Video element detached from DOM');
    }

    return hasVideo && hasMediaElement && isVideoInDOM;
  }

  public getCurrentVideo(): HTMLVideoElement | null {
    return this.currentVideo;
  }

  public cleanup(): void {
    this.lifecycleObserver.removeListeners(this.currentVideo);
    this.lifecycleObserver.cleanup();
    this.currentVideo = null;
    this.logger.info('VideoAttachmentManager cleaned up');
  }
}
