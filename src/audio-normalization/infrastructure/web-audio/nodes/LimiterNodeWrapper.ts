/**
   * Hard limiter wrapper for DynamicsCompressorNode.
   */
export class LimiterNodeWrapper {
  constructor(private readonly node: DynamicsCompressorNode) {
    this.configureAsLimiter();
  }

  private configureAsLimiter(): void {
    this.node.threshold.value = -3;
    this.node.knee.value = 0;
    this.node.ratio.value = 20;

    this.node.attack.value = 0.001;

    this.node.release.value = 0.05;
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
