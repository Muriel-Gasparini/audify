import { VolumeLevel } from '../../../../shared/domain/value-objects/VolumeLevel';
import { NormalizationAlgorithm } from '../../../domain/services/NormalizationAlgorithm';

/**
 * Wrapper para AnalyserNode da Web Audio API
 * Encapsula medição de volume
 */
export class AnalyserNodeWrapper {
  constructor(private readonly node: AnalyserNode) {
    // FFT size maior = análise mais estável e precisa
    // 2048 samples @ 48kHz = ~42ms de janela de análise
    // Reduz flutuações rápidas que causam artefatos
    this.node.fftSize = 2048;

    // Smoothing para suavizar medições entre frames
    this.node.smoothingTimeConstant = 0.8;
  }

  /**
   * Mede o volume atual do áudio
   */
  public measureVolume(): VolumeLevel {
    const data = new Float32Array(this.node.fftSize);
    this.node.getFloatTimeDomainData(data);
    return NormalizationAlgorithm.calculateVolume(data);
  }

  public connect(destination: AudioNode): void {
    this.node.connect(destination);
  }

  public disconnect(): void {
    try {
      this.node.disconnect();
    } catch {
      // Ignora erros de desconexão
    }
  }

  public getNativeNode(): AnalyserNode {
    return this.node;
  }
}
