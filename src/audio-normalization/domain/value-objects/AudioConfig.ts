import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { TargetLevel } from '../../../shared/domain/value-objects/TargetLevel';

/**
 * Value Object: AudioConfig
 * Agrupa todas as configurações de áudio necessárias para normalização
 *
 * Encapsula as regras de negócio de validação
 */
export class AudioConfig {
  constructor(
    public readonly targetLevel: TargetLevel,
    public readonly maxGain: GainValue,
    public readonly minGain: GainValue
  ) {
    // Valida regra de negócio: minGain deve ser menor que maxGain
    if (minGain.isGreaterThan(maxGain)) {
      throw new Error('minGain cannot be greater than maxGain');
    }
  }

  /**
   * Cria configuração a partir de valores primitivos
   */
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

  /**
   * Cria nova configuração com valores atualizados
   */
  public withTargetLevel(targetLevel: TargetLevel): AudioConfig {
    return new AudioConfig(targetLevel, this.maxGain, this.minGain);
  }

  public withMaxGain(maxGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, maxGain, this.minGain);
  }

  public withMinGain(minGain: GainValue): AudioConfig {
    return new AudioConfig(this.targetLevel, this.maxGain, minGain);
  }

  /**
   * Garante que um gain está dentro dos limites configurados
   */
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
