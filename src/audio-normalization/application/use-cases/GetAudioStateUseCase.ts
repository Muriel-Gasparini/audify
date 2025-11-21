import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { AudioStateDTO } from '../dto/AudioStateDTO';

/**
   * Retrieves current audio normalizer state.
   * @returns {AudioStateDTO} Current state for UI
   */
export class GetAudioStateUseCase {
  constructor(private readonly service: AudioNormalizationService) {}

  public execute(): AudioStateDTO {
    const gain = this.service.getCurrentGain();
    const isActive = this.service.isNormalizerActive();
    const hasVideo = this.service.hasVideoAttached();

    const state = {
      gain: gain.getValue(),
      volume: 0,
      isActive,
      hasVideo,
    };

    console.log('[GetAudioStateUseCase] Returning state:', state);
    return state;
  }
}
