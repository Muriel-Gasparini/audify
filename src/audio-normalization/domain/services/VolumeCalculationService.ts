import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { NormalizationAlgorithm } from './NormalizationAlgorithm';

/**
   * Volume calculation domain service.
   */
export class VolumeCalculationService {
  public calculateCurrentVolume(timeDomainData: Float32Array): VolumeLevel {
    return NormalizationAlgorithm.calculateVolume(timeDomainData);
  }

  public isSilent(volume: VolumeLevel): boolean {
    return volume.isSilence();
  }
}
