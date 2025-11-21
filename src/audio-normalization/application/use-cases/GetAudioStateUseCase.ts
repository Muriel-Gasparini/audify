import { IAudioNormalizationService } from '../ports/IAudioNormalizationService';
import { AudioStateDTO } from '../dto/AudioStateDTO';

export class GetAudioStateUseCase {
  constructor(private readonly service: IAudioNormalizationService) {}

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

    return state;
  }
}
