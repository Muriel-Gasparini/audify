import { IAudioProcessingStrategy } from './IAudioProcessingStrategy';

/**
   * Strategy: Active Processing.
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
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(destination);

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
    }
  }
}
