/**
 * Interface para estratégias de processamento de áudio (Strategy Pattern)
 *
 * Permite alternar entre diferentes modos de processamento
 */
export interface IAudioProcessingStrategy {
  /**
   * Conecta os nós de áudio de acordo com a estratégia
   */
  connect(
    source: MediaElementAudioSourceNode,
    gain: GainNode,
    compressor: DynamicsCompressorNode,
    limiter: DynamicsCompressorNode,
    analyser: AnalyserNode,
    destination: AudioDestinationNode
  ): void;

  /**
   * Desconecta todos os nós
   */
  disconnect(
    source: MediaElementAudioSourceNode,
    gain: GainNode,
    compressor: DynamicsCompressorNode,
    limiter: DynamicsCompressorNode,
    analyser: AnalyserNode
  ): void;
}
