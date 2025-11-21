/**
   * Audio volume level value object (0.
   */
export class VolumeLevel {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): VolumeLevel {
    if (!isFinite(value) || value < 0) {
      return new VolumeLevel(0);
    }
    return new VolumeLevel(value);
  }

  public static silence(): VolumeLevel {
    return new VolumeLevel(0);
  }

  public getValue(): number {
    return this.value;
  }

  public isSilence(): boolean {
    return this.value < 0.001;
  }

  public isAbove(threshold: VolumeLevel): boolean {
    return this.value > threshold.value;
  }

  public isBelow(threshold: VolumeLevel): boolean {
    return this.value < threshold.value;
  }

  public equals(other: VolumeLevel): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toFixed(3);
  }
}
