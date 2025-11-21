import { IAudioProcessingStrategy } from './IAudioProcessingStrategy';

/**
   * Strategy: Bypass Processing.
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
    source.connect(destination);

    source.connect(gain);
    gain.connect(analyser);

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
    }
  }
}
