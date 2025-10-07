import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
 * Resultado da ativação do normalizador
 */
export type ActivationResult =
  | { success: true }
  | { success: false; reason: 'NO_VIDEO' | 'ALREADY_ACTIVE' };

/**
 * Use Case: Ativar Normalizador
 *
 * Responsabilidade:
 * - Ativar o normalizador de áudio
 * - Validar pré-condições
 * - Retornar resultado (sucesso ou motivo da falha)
 *
 * IMPORTANTE: Este use case NÃO lança exceções.
 * Estados esperados (como "sem vídeo") são retornados como resultados.
 * Isso permite que o handler implemente ativação diferida quando o vídeo
 * não está disponível ainda.
 */
export class ActivateNormalizerUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Executa a ativação do normalizador
   *
   * @returns Resultado da operação (sucesso ou motivo da falha)
   */
  public execute(): ActivationResult {
    if (!this.service.hasVideoAttached()) {
      this.logger.info('Cannot activate normalizer: no video attached (will activate when video is discovered)');
      return { success: false, reason: 'NO_VIDEO' };
    }

    if (this.service.isNormalizerActive()) {
      this.logger.info('Normalizer already active');
      return { success: false, reason: 'ALREADY_ACTIVE' };
    }

    this.service.activate();
    this.logger.info('Normalizer activated via use case');
    return { success: true };
  }
}
