import { GainValue } from '../../../../shared/domain/value-objects/GainValue';

/**
   * Web Audio API GainNode wrapper with value object encapsulation.
   */
export class GainNodeWrapper {
  constructor(private readonly node: GainNode) {}

  public setGain(gain: GainValue): void {
    this.node.gain.value = gain.getValue();
  }

  public setGainSmooth(gain: GainValue, timeConstant: number = 0.05): void {
    const audioContext = this.node.context;
    const targetValue = gain.getValue();

    this.node.gain.cancelScheduledValues(audioContext.currentTime);

    const currentValue = this.node.gain.value;

    const safeCurrentValue = Math.max(currentValue, 0.0001);
    const safeTargetValue = Math.max(targetValue, 0.0001);

    this.node.gain.value = safeCurrentValue;
    this.node.gain.exponentialRampToValueAtTime(
      safeTargetValue,
      audioContext.currentTime + timeConstant
    );
  }

  public getCurrentGain(): GainValue {
    return GainValue.createSafe(this.node.gain.value);
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

  public getNativeNode(): GainNode {
    return this.node;
  }
}
