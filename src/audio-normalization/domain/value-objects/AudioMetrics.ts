import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';

/**
   * Audio metrics snapshot for normalization decisions.
   */
export class AudioMetrics {
  constructor(
    public readonly volume: VolumeLevel,
    public readonly currentGain: GainValue,
    public readonly timestamp: Date = new Date()
  ) {}

  public isSilent(): boolean {
    return this.volume.isSilence();
  }

  public isVolumeHigh(targetLevel: VolumeLevel): boolean {
    return this.volume.isAbove(targetLevel);
  }

  public isVolumeLow(targetLevel: VolumeLevel): boolean {
    return this.volume.isBelow(targetLevel);
  }

  public toString(): string {
    return `AudioMetrics(volume=${this.volume}, gain=${this.currentGain})`;
  }
}
