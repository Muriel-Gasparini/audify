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
    onVideoRemoved: () => void
  ): void {
    if (this.currentVideo === video && this.adapter.isInitialized()) {
      this.logger.info('Already attached to this video');
      this.logger.debug('attachToVideo - Already attached, skipping');
      return;
    }

    this.logger.info('Attaching to video element');
    this.logger.debug('attachToVideo - NEW ATTACHMENT:', {
      videoSrc: video.src || video.currentSrc,
      videoReadyState: video.readyState,
      videoConnected: video.isConnected,
      previousVideoExists: this.currentVideo !== null,
      previousVideoConnected: this.currentVideo?.isConnected ?? false,
      sameVideoElement: this.currentVideo === video,
      adapterWasInitialized: this.adapter.isInitialized()
    });

    if (this.currentVideo !== video) {
      this.logger.debug('attachToVideo - Soft detaching from previous video (preserving AudioContext)');
      this.detachFromCurrentVideo();
    }

    this.currentVideo = video;

    try {
      this.adapter.attachToVideo(video);
      this.logger.debug('attachToVideo - After attachment, adapter initialized:', this.adapter.isInitialized());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isSourceNodeConflict = errorMessage.includes('already has') ||
                                   errorMessage.includes('MediaElementAudioSourceNode') ||
                                   errorMessage.includes('already being used');

      if (isSourceNodeConflict) {
        this.logger.warn('MediaElementSource conflict detected - cleaning up and retrying once');
        this.logger.warn('MediaElementSource conflict detected, attempting recovery with cleanup and retry');

        try {
          this.adapter.cleanup();
          this.logger.debug('Retrying attachment after cleanup...');
          this.adapter.attachToVideo(video);
          this.logger.debug('RETRY SUCCESSFUL - adapter initialized:', this.adapter.isInitialized());
          this.logger.info('Successfully attached after MediaElementSource conflict recovery');
        } catch (retryError) {
          this.logger.error('RETRY FAILED after cleanup:', retryError);
          this.logger.error('Failed to attach even after cleanup and retry', retryError);
          this.currentVideo = null;
          throw retryError;
        }
      } else {
        this.logger.error('FAILED to attach adapter to video:', error);
        this.logger.error('Failed to attach adapter to video', error);
        this.currentVideo = null;
        throw error;
      }
    }

    if (isNormalizerActive) {
      this.logger.debug('Normalizer is ACTIVE - connecting in ACTIVE mode (full processing)');
      this.adapter.setActive(true);
    } else {
      this.logger.debug('Normalizer is INACTIVE - connecting in BYPASS mode (direct audio)');
      this.adapter.setActive(false);
    }

    this.adapter.resume();

    this.lifecycleObserver.observeVideo(video, onSeeking, onVideoRemoved);
  }

  public detachFromCurrentVideo(): void {
    this.logger.debug('detachFromVideo() - soft detach (keeping AudioContext alive)');

    this.lifecycleObserver.removeListeners(this.currentVideo);

    if (this.adapter.isInitialized()) {
      this.adapter.setActive(false);
    }

    this.currentVideo = null;

    this.logger.info('Soft detached from video (AudioContext preserved for re-attachment)');
  }

  public hasVideoAttached(): boolean {
    const hasVideo = this.currentVideo !== null;
    const isAdapterInit = this.adapter.isInitialized();
    const isVideoInDOM = this.currentVideo?.isConnected ?? false;
    const result = hasVideo && isAdapterInit && isVideoInDOM;

    this.logger.debug('hasVideoAttached() check:', {
      currentVideo: this.currentVideo ? 'EXISTS' : 'NULL',
      videoInDOM: isVideoInDOM,
      adapterInitialized: isAdapterInit,
      result: result
    });

    if (hasVideo && !isVideoInDOM) {
      this.logger.warn('Video element detached from DOM (will be handled by caller)');
      this.logger.warn('Video element no longer in DOM - reporting false to caller');
    }

    return result;
  }

  public getCurrentVideo(): HTMLVideoElement | null {
    return this.currentVideo;
  }

  public cleanup(): void {
    this.logger.debug('cleanup() called - FULL TEARDOWN', {
      hadVideo: this.currentVideo !== null,
    });

    this.lifecycleObserver.removeListeners(this.currentVideo);
    this.lifecycleObserver.cleanup();
    this.currentVideo = null;

    this.logger.info('VideoAttachmentManager cleaned up');
  }
}
