import { AudioConfig } from '../value-objects/AudioConfig';
import { AudioMetrics } from '../value-objects/AudioMetrics';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';

/**
   * Audio normalization processor entity.
   */
export class AudioProcessor {
  private static readonly SMOOTHING_FACTOR = 0.1;

  constructor(private config: AudioConfig) {}

  public updateConfig(config: AudioConfig): void {
    this.config = config;
  }

  public calculateNextGain(metrics: AudioMetrics): GainValue {
    if (metrics.isSilent()) {
      return metrics.currentGain;
    }

    const volume = metrics.volume.getValue();
    const targetLevel = this.config.targetLevel.getValue();

    let desiredGain = targetLevel / (volume + 0.0001);

    if (volume > targetLevel) {
      desiredGain = Math.min(desiredGain, this.config.minGain.getValue());
    }

    const desiredGainValue = GainValue.createSafe(desiredGain);

    const clampedDesiredGain = this.config.clampGain(desiredGainValue);

    const currentGain = metrics.currentGain.getValue();
    const targetGain = clampedDesiredGain.getValue();
    const smoothedGain = currentGain + (targetGain - currentGain) * AudioProcessor.SMOOTHING_FACTOR;

    return GainValue.createSafe(smoothedGain);
  }

  public calculateResetGain(currentGain: GainValue): GainValue {
    const current = currentGain.getValue();

    if (current < 0.3) {
      const resetValue = Math.max(0.5, this.config.minGain.getValue() * 2);
      return GainValue.createSafe(resetValue);
    } else {
      return GainValue.createSafe(1.0);
    }
  }

  public getConfig(): AudioConfig {
    return this.config;
  }
}
