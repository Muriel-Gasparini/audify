import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';

/**
   * Audio volume calculation algorithms.
   */
export class NormalizationAlgorithm {
  public static calculateVolume(timeDomainData: Float32Array): VolumeLevel {
    let sumOfSquares = 0;
    let peak = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const abs = Math.abs(timeDomainData[i]);
      sumOfSquares += timeDomainData[i] * timeDomainData[i];

      if (abs > peak) {
        peak = abs;
      }
    }

    const rms = Math.sqrt(sumOfSquares / timeDomainData.length);

    if (peak > rms * 1.5) {
      const volumeValue = peak * 0.7;
      return VolumeLevel.create(volumeValue);
    }

    return VolumeLevel.create(rms);
  }

  public static calculateRMS(timeDomainData: Float32Array): number {
    let sumOfSquares = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      sumOfSquares += timeDomainData[i] * timeDomainData[i];
    }

    return Math.sqrt(sumOfSquares / timeDomainData.length);
  }

  public static detectPeak(timeDomainData: Float32Array): number {
    let peak = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const abs = Math.abs(timeDomainData[i]);
      if (abs > peak) {
        peak = abs;
      }
    }

    return peak;
  }
}
