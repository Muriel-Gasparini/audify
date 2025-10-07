import { AudioConfig } from '../value-objects/AudioConfig';
import { AudioMetrics } from '../value-objects/AudioMetrics';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';

/**
 * Entity: AudioProcessor
 * Entidade central que encapsula a lógica de normalização de áudio
 *
 * Responsabilidades:
 * - Calcular o gain necessário baseado no volume atual
 * - Aplicar suavização (smoothing)
 * - Garantir que regras de negócio sejam respeitadas
 */
export class AudioProcessor {
  private static readonly SMOOTHING_FACTOR = 0.1; // 10% de mudança por frame

  constructor(private config: AudioConfig) {}

  /**
   * Atualiza a configuração do processador
   */
  public updateConfig(config: AudioConfig): void {
    this.config = config;
  }

  /**
   * Calcula o próximo valor de gain baseado nas métricas atuais
   *
   * Implementa a lógica de normalização:
   * 1. Ignora silêncio
   * 2. Calcula gain desejado para atingir targetLevel
   * 3. Se volume alto, força minGain
   * 4. Aplica suavização
   * 5. Clamp entre minGain e maxGain
   */
  public calculateNextGain(metrics: AudioMetrics): GainValue {
    // Ignora silêncio - mantém gain atual
    if (metrics.isSilent()) {
      return metrics.currentGain;
    }

    const volume = metrics.volume.getValue();
    const targetLevel = this.config.targetLevel.getValue();

    // Calcula gain desejado para atingir targetLevel
    let desiredGain = targetLevel / (volume + 0.0001); // Evita divisão por zero

    // REGRA CRÍTICA: Se volume alto, força minGain
    // Isso garante que cenas altas sempre vão para minGain
    if (volume > targetLevel) {
      desiredGain = Math.min(desiredGain, this.config.minGain.getValue());
    }

    // Cria GainValue de forma segura
    const desiredGainValue = GainValue.createSafe(desiredGain);

    // Aplica clamp entre minGain e maxGain
    const clampedDesiredGain = this.config.clampGain(desiredGainValue);

    // Aplica suavização (interpolação linear)
    const currentGain = metrics.currentGain.getValue();
    const targetGain = clampedDesiredGain.getValue();
    const smoothedGain = currentGain + (targetGain - currentGain) * AudioProcessor.SMOOTHING_FACTOR;

    return GainValue.createSafe(smoothedGain);
  }

  /**
   * Calcula um gain de reset apropriado quando o vídeo pula (seeking)
   *
   * Lógica:
   * - Se estava em cena alta (gain baixo), reseta para valor médio
   * - Se estava normal, reseta para 1.0
   */
  public calculateResetGain(currentGain: GainValue): GainValue {
    const current = currentGain.getValue();

    if (current < 0.3) {
      // Estava em cena alta - reseta para valor médio
      const resetValue = Math.max(0.5, this.config.minGain.getValue() * 2);
      return GainValue.createSafe(resetValue);
    } else {
      // Estava normal - reseta para 1.0
      return GainValue.createSafe(1.0);
    }
  }

  public getConfig(): AudioConfig {
    return this.config;
  }
}
