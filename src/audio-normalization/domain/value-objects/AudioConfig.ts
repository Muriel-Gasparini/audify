import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { TargetLevel } from '../../../shared/domain/value-objects/TargetLevel';

export class AudioConfig {
  constructor(
    public readonly targetLevel: TargetLevel,
    public readonly maxGain: GainValue,
    public readonly minGain: GainValue,
    public readonly isActive: boolean = false
  ) {
    if (minGain.isGreaterThan(maxGain)) {
      throw new Error('minGain cannot be greater than maxGain');
    }
  }

  public static fromPrimitives(
    targetLevel: number,
    maxGain: number,
    minGain: number,
    isActive: boolean = false
  ): AudioConfig {
    return new AudioConfig(
      TargetLevel.createSafe(targetLevel),
      GainValue.createSafe(maxGain),
      GainValue.createSafe(minGain),
      isActive
    );
  }

  public toPrimitives(): { targetLevel: number; maxGain: number; minGain: number; isActive: boolean } {
    return {
      targetLevel: this.targetLevel.getValue(),
      maxGain: this.maxGain.getValue(),
      minGain: this.minGain.getValue(),
      isActive: this.isActive,
    };
  }

  public withTargetLevel(targetLevel: TargetLevel): AudioConfig {
    return new AudioConfig(targetLevel, this.maxGain, this.minGain, this.isActive);
  }

  public withMaxGain(maxGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, maxGain, this.minGain, this.isActive);
  }

  public withMinGain(minGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, this.maxGain, minGain, this.isActive);
  }

  public withIsActive(isActive: boolean): AudioConfig {
    return new AudioConfig(this.targetLevel, this.maxGain, this.minGain, isActive);
  }

  public clampGain(gain: GainValue): GainValue {
    return gain.clamp(this.minGain, this.maxGain);
  }

  public equals(other: AudioConfig): boolean {
    return (
      this.targetLevel.equals(other.targetLevel) &&
      this.maxGain.equals(other.maxGain) &&
      this.minGain.equals(other.minGain) &&
      this.isActive === other.isActive
    );
  }
}
