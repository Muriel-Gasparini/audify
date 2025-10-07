import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { AudioStateDTO } from '../dto/AudioStateDTO';

/**
 * Use Case: Obter Estado do Áudio
 *
 * Responsabilidade:
 * - Coletar estado atual do normalizador
 * - Retornar DTO para a UI
 */
export class GetAudioStateUseCase {
  constructor(private readonly service: AudioNormalizationService) {}

  public execute(): AudioStateDTO {
    const gain = this.service.getCurrentGain();
    const isActive = this.service.isNormalizerActive();
    const hasVideo = this.service.hasVideoAttached();

    const state = {
      gain: gain.getValue(),
      volume: 0, // Volume é medido no loop de normalização
      isActive,
      hasVideo,
    };

    console.log('[GetAudioStateUseCase] Returning state:', state);
    return state;
  }
}
