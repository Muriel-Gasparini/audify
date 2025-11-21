import { VideoDetectionService } from '../../infrastructure/VideoDetectionService';
import { NetflixVideo } from '../../domain/entities/NetflixVideo';

/**
   * Detects Netflix video elements.
   */
export class DetectVideoUseCase {
  constructor(private readonly videoDetectionService: VideoDetectionService) {}

  public execute(onVideoFound: (video: NetflixVideo) => void): void {
    this.videoDetectionService.startDetection(onVideoFound);
  }

  public stop(): void {
    this.videoDetectionService.stopDetection();
  }
}
