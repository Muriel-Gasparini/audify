/**
   * Web Audio API DynamicsCompressorNode wrapper configured for normalization.
   */
export class CompressorNodeWrapper {
  constructor(private readonly node: DynamicsCompressorNode) {
    this.configureAsCompressor();
  }

  private configureAsCompressor(): void {
    this.node.threshold.value = -18;
    this.node.knee.value = 15;
    this.node.ratio.value = 12;

    this.node.attack.value = 0.005;

    this.node.release.value = 0.25;
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

  public getNativeNode(): DynamicsCompressorNode {
    return this.node;
  }
}
