import { GainValue } from '../../../../shared/domain/value-objects/GainValue';

/**
 * Wrapper para GainNode da Web Audio API
 * Encapsula a manipulação do GainNode com Value Objects
 */
export class GainNodeWrapper {
  constructor(private readonly node: GainNode) {}

  public setGain(gain: GainValue): void {
    this.node.gain.value = gain.getValue();
  }

  public setGainSmooth(gain: GainValue, timeConstant: number = 0.05): void {
    const audioContext = this.node.context;
    const targetValue = gain.getValue();

    // Cancela automações anteriores para evitar conflitos
    this.node.gain.cancelScheduledValues(audioContext.currentTime);

    // Usa exponentialRampToValueAtTime ao invés de setTargetAtTime
    // para transições mais previsíveis e suaves
    const currentValue = this.node.gain.value;

    // Evita valores zero que causam erro no exponentialRamp
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
      // Ignora erros de desconexão
    }
  }

  public getNativeNode(): GainNode {
    return this.node;
  }
}
