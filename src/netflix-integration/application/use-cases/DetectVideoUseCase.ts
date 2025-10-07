import { VideoDetectionService } from '../../infrastructure/VideoDetectionService';
import { NetflixVideo } from '../../domain/entities/NetflixVideo';

/**
 * Use Case: Detectar Vídeo do Netflix
 *
 * Responsabilidade:
 * - Iniciar detecção de vídeo
 * - Executar callback quando vídeo for encontrado
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
