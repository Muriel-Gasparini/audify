/**
 * Value Object: VolumeLevel
 * Representa o nível de volume medido do áudio (0.0 a 1.0)
 *
 * Regras de negócio:
 * - Deve ser um número finito não-negativo
 * - Normalmente entre 0.0 e 1.0, mas pode exceder (clipping)
 * - Imutável após criação
 */
export class VolumeLevel {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Cria um VolumeLevel a partir de um número
   */
  public static create(value: number): VolumeLevel {
    // Volume pode ser qualquer valor não-negativo finito
    if (!isFinite(value) || value < 0) {
      return new VolumeLevel(0);
    }
    return new VolumeLevel(value);
  }

  /**
   * Cria um VolumeLevel representando silêncio
   */
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
