import { InvalidGainException } from '../exceptions/InvalidGainException';

/**
 * Value Object: GainValue
 * Representa um valor de ganho de áudio válido
 *
 * Regras de negócio:
 * - Deve ser um número finito
 * - Deve estar entre 0.01 e 16.0
 * - Imutável após criação
 */
export class GainValue {
  private static readonly MIN_VALUE = 0.01;
  private static readonly MAX_VALUE = 16.0;

  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Cria um GainValue a partir de um número
   * @throws InvalidGainException se o valor for inválido
   */
  public static create(value: number): GainValue {
    this.validate(value);
    return new GainValue(value);
  }

  /**
   * Cria um GainValue com validação silenciosa (clamp)
   * Não lança exceção, ajusta o valor para o range válido
   */
  public static createSafe(value: number): GainValue {
    if (!isFinite(value) || value <= 0) {
      return new GainValue(this.MIN_VALUE);
    }

    const clamped = Math.max(this.MIN_VALUE, Math.min(this.MAX_VALUE, value));
    return new GainValue(clamped);
  }

  private static validate(value: number): void {
    if (!isFinite(value)) {
      throw new InvalidGainException(
        `Gain value must be finite, got: ${value}`
      );
    }

    if (value < this.MIN_VALUE || value > this.MAX_VALUE) {
      throw new InvalidGainException(
        `Gain value must be between ${this.MIN_VALUE} and ${this.MAX_VALUE}, got: ${value}`
      );
    }
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: GainValue): boolean {
    return this.value === other.value;
  }

  public isGreaterThan(other: GainValue): boolean {
    return this.value > other.value;
  }

  public isLessThan(other: GainValue): boolean {
    return this.value < other.value;
  }

  public clamp(min: GainValue, max: GainValue): GainValue {
    if (min.isGreaterThan(max)) {
      throw new InvalidGainException('Min gain cannot be greater than max gain');
    }

    const clamped = Math.max(min.value, Math.min(max.value, this.value));
    return new GainValue(clamped);
  }

  public toString(): string {
    return this.value.toFixed(2);
  }
}
