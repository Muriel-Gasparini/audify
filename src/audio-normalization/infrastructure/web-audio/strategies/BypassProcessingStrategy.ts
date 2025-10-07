import { IAudioProcessingStrategy } from './IAudioProcessingStrategy';

/**
 * Strategy: Bypass Processing
 * Conecta áudio direto sem processamento (áudio original 100%)
 *
 * Fluxo: source → destination (direto)
 *        source → gain → analyser (só para medição, não afeta áudio)
 */
export class BypassProcessingStrategy implements IAudioProcessingStrategy {
  public connect(
    source: MediaElementAudioSourceNode,
    gain: GainNode,
    _compressor: DynamicsCompressorNode,
    _limiter: DynamicsCompressorNode,
    analyser: AnalyserNode,
    destination: AudioDestinationNode
  ): void {
    // Áudio direto sem processamento
    source.connect(destination);

    // Gain e analyser apenas para medição (não afeta o áudio)
    source.connect(gain);
    gain.connect(analyser);

    // Reseta gain para 1.0 (não afeta o áudio pois não está na cadeia principal)
    gain.gain.value = 1.0;
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
