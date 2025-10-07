import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { NormalizationAlgorithm } from './NormalizationAlgorithm';

/**
 * Domain Service: VolumeCalculationService
 * Serviço de domínio para cálculo de volume
 *
 * Wrapper de alto nível para o algoritmo de normalização
 */
export class VolumeCalculationService {
  /**
   * Calcula o volume atual do áudio
   */
  public calculateCurrentVolume(timeDomainData: Float32Array): VolumeLevel {
    return NormalizationAlgorithm.calculateVolume(timeDomainData);
  }

  /**
   * Verifica se o áudio está em silêncio
   */
  public isSilent(volume: VolumeLevel): boolean {
    return volume.isSilence();
  }
}
