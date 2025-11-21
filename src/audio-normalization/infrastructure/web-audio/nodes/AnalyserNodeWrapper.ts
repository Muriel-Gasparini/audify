import { VolumeLevel } from '../../../../shared/domain/value-objects/VolumeLevel';
import { NormalizationAlgorithm } from '../../../domain/services/NormalizationAlgorithm';

/**
   * Web Audio API AnalyserNode wrapper for volume measurement.
   */
export class AnalyserNodeWrapper {
  constructor(private readonly node: AnalyserNode) {
    this.node.fftSize = 2048;

    this.node.smoothingTimeConstant = 0.8;
  }

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
    }
  }

  public getNativeNode(): AnalyserNode {
    return this.node;
  }
}
