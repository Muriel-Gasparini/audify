import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';

/**
 * Value Object: AudioMetrics
 * Representa métricas medidas do áudio em um dado momento
 *
 * Usado para decisões de normalização
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

  /**
   * Verifica se o volume está alto demais (acima do alvo)
   */
  public isVolumeHigh(targetLevel: VolumeLevel): boolean {
    return this.volume.isAbove(targetLevel);
  }

  /**
   * Verifica se o volume está baixo demais (abaixo do alvo)
   */
  public isVolumeLow(targetLevel: VolumeLevel): boolean {
    return this.volume.isBelow(targetLevel);
  }

  public toString(): string {
    return `AudioMetrics(volume=${this.volume}, gain=${this.currentGain})`;
  }
}
