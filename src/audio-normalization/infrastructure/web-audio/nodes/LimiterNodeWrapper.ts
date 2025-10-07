/**
 * Wrapper para DynamicsCompressorNode configurado como Hard Limiter
 * Último recurso contra picos extremos
 */
export class LimiterNodeWrapper {
  constructor(private readonly node: DynamicsCompressorNode) {
    this.configureAsLimiter();
  }

  /**
   * Configura como hard limiter (brick wall)
   * Otimizado para evitar distorção em picos extremos
   */
  private configureAsLimiter(): void {
    this.node.threshold.value = -3; // Limite absoluto mais alto (headroom)
    this.node.knee.value = 0; // Hard knee para limitação precisa
    this.node.ratio.value = 20; // Brick wall (limitação forte)

    // Attack mínimo mas não zero para evitar distorção
    this.node.attack.value = 0.001;

    // Release rápido para recuperação natural
    this.node.release.value = 0.05;
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

  public getNativeNode(): DynamicsCompressorNode {
    return this.node;
  }
}
