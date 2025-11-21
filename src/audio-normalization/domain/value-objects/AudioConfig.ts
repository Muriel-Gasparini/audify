import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { TargetLevel } from '../../../shared/domain/value-objects/TargetLevel';

/**
   * Audio normalization configuration value object.
   */
export class AudioConfig {
  constructor(
    public readonly targetLevel: TargetLevel,
    public readonly maxGain: GainValue,
    public readonly minGain: GainValue
  ) {
    if (minGain.isGreaterThan(maxGain)) {
      throw new Error('minGain cannot be greater than maxGain');
    }
  }

  public static fromPrimitives(
    targetLevel: number,
    maxGain: number,
    minGain: number
  ): AudioConfig {
    return new AudioConfig(
      TargetLevel.createSafe(targetLevel),
      GainValue.createSafe(maxGain),
      GainValue.createSafe(minGain)
    );
  }

  public withTargetLevel(targetLevel: TargetLevel): AudioConfig {
    return new AudioConfig(targetLevel, this.maxGain, this.minGain);
  }

  public withMaxGain(maxGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, maxGain, this.minGain);
  }

  public withMinGain(minGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, this.maxGain, minGain);
  }

  public clampGain(gain: GainValue): GainValue {
    return gain.clamp(this.minGain, this.maxGain);
  }

  public equals(other: AudioConfig): boolean {
    return (
      this.targetLevel.equals(other.targetLevel) &&
      this.maxGain.equals(other.maxGain) &&
      this.minGain.equals(other.minGain)
    );
  }
}
