import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';

/**
 * Domain Service: NormalizationAlgorithm
 * Encapsula algoritmos de cálculo de volume
 *
 * Responsabilidades:
 * - Calcular RMS (Root Mean Square)
 * - Detectar picos
 * - Escolher melhor método de medição
 */
export class NormalizationAlgorithm {
  /**
   * Calcula o volume médio de um buffer de áudio
   *
   * Usa RMS como base, mas detecta picos instantâneos
   * que o RMS não detectaria (transientes)
   */
  public static calculateVolume(timeDomainData: Float32Array): VolumeLevel {
    let sumOfSquares = 0;
    let peak = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const abs = Math.abs(timeDomainData[i]);
      sumOfSquares += timeDomainData[i] * timeDomainData[i];

      // Detecta pico máximo
      if (abs > peak) {
        peak = abs;
      }
    }

    const rms = Math.sqrt(sumOfSquares / timeDomainData.length);

    // Se houver pico significativo (>50% acima do RMS), usa o pico
    // Isso pega transientes instantâneos que o RMS não detectaria
    if (peak > rms * 1.5) {
      const volumeValue = peak * 0.7; // Usa 70% do pico para não ser muito agressivo
      return VolumeLevel.create(volumeValue);
    }

    return VolumeLevel.create(rms);
  }

  /**
   * Calcula apenas RMS (sem detecção de picos)
   */
  public static calculateRMS(timeDomainData: Float32Array): number {
    let sumOfSquares = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      sumOfSquares += timeDomainData[i] * timeDomainData[i];
    }

    return Math.sqrt(sumOfSquares / timeDomainData.length);
  }

  /**
   * Detecta o pico máximo no buffer
   */
  public static detectPeak(timeDomainData: Float32Array): number {
    let peak = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const abs = Math.abs(timeDomainData[i]);
      if (abs > peak) {
        peak = abs;
      }
    }

    return peak;
  }
}
