import { InvalidTargetLevelException } from '../exceptions/InvalidTargetLevelException';

/**
   * Target volume level value object (0.
   * @throws {InvalidTargetLevelException}
   */
export class TargetLevel {
  private static readonly MIN_VALUE = 0.01;
  private static readonly MAX_VALUE = 0.3;

  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * @throws {InvalidTargetLevelException}
   */
  public static create(value: number): TargetLevel {
    this.validate(value);
    return new TargetLevel(value);
  }

  public static createSafe(value: number): TargetLevel {
    if (!isFinite(value) || value <= 0) {
      return new TargetLevel(this.MIN_VALUE);
    }

    const clamped = Math.max(this.MIN_VALUE, Math.min(this.MAX_VALUE, value));
    return new TargetLevel(clamped);
  }

  private static validate(value: number): void {
    if (!isFinite(value)) {
      throw new InvalidTargetLevelException(
        `Target level must be finite, got: ${value}`
      );
    }

    if (value < this.MIN_VALUE || value > this.MAX_VALUE) {
      throw new InvalidTargetLevelException(
        `Target level must be between ${this.MIN_VALUE} and ${this.MAX_VALUE}, got: ${value}`
      );
    }
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: TargetLevel): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toFixed(2);
  }
}
