import { IAudioProcessingStrategy } from './IAudioProcessingStrategy';

/**
 * Strategy: Active Processing
 * Conecta toda a cadeia de processamento de áudio
 *
 * Fluxo: source → gain → compressor → limiter → destination
 *        source → gain → analyser (para medição)
 */
export class ActiveProcessingStrategy implements IAudioProcessingStrategy {
  public connect(
    source: MediaElementAudioSourceNode,
    gain: GainNode,
    compressor: DynamicsCompressorNode,
    limiter: DynamicsCompressorNode,
    analyser: AnalyserNode,
    destination: AudioDestinationNode
  ): void {
    // Cadeia principal de processamento
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(destination);

    // Analyser para medição (paralelo)
    gain.connect(analyser);
  }

  public disconnect(
    source: MediaElementAudioSourceNode,
    gain: GainNode,
    compressor: DynamicsCompressorNode,
    limiter: DynamicsCompressorNode,
    analyser: AnalyserNode
  ): void {
    try {
      source.disconnect();
      gain.disconnect();
      compressor.disconnect();
      limiter.disconnect();
      analyser.disconnect();
    } catch {
      // Ignora erros de desconexão
    }
  }
}
