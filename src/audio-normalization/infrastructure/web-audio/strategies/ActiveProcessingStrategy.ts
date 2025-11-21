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
    console.log('[ActiveProcessingStrategy] Connecting in ACTIVE mode with full processing chain...');

    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(destination);
    console.log('[ActiveProcessingStrategy] Connected: source → gain → compressor → limiter → destination (PROCESSED AUDIO OUTPUT)');

    gain.connect(analyser);
    console.log('[ActiveProcessingStrategy] Connected: gain → analyser (for volume monitoring)');
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
