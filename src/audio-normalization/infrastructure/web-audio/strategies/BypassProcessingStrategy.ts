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
    console.log('[BypassProcessingStrategy] Connecting in BYPASS mode...');

    source.connect(destination);
    console.log('[BypassProcessingStrategy] Connected: source → destination (DIRECT AUDIO OUTPUT)');

    source.connect(gain);
    gain.connect(analyser);
    console.log('[BypassProcessingStrategy] Connected: source → gain → analyser (for monitoring only)');

    gain.gain.value = 1.0;
    console.log('[BypassProcessingStrategy] Set gain to 1.0 (monitoring branch, does not affect audio output)');
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
