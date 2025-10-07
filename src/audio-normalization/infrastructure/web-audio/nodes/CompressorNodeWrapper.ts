/**
 * Wrapper para DynamicsCompressorNode da Web Audio API
 * Configura compressor para normalização
 */
export class CompressorNodeWrapper {
  constructor(private readonly node: DynamicsCompressorNode) {
    this.configureAsCompressor();
  }

  /**
   * Configura como compressor agressivo para pegar picos
   * Parâmetros otimizados para evitar artefatos audíveis (pumping/breathing)
   */
  private configureAsCompressor(): void {
    this.node.threshold.value = -18; // Começa a comprimir em -18dB
    this.node.knee.value = 15; // Knee médio para transição mais suave
    this.node.ratio.value = 12; // Ratio moderado (12:1)

    // Attack time aumentado para evitar distorção em transientes
    // 5ms é rápido o suficiente para picos mas evita cliques
    this.node.attack.value = 0.005;

    // Release time otimizado para recuperação natural
    // 250ms evita pumping audível
    this.node.release.value = 0.25;
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
