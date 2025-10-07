import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
 * Use Case: Ativar Normalizador
 *
 * Responsabilidade:
 * - Ativar o normalizador de áudio
 * - Validar pré-condições
 */
export class ActivateNormalizerUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  public execute(): void {
    if (!this.service.hasVideoAttached()) {
      this.logger.warn('Cannot activate normalizer: no video attached');
      throw new Error('No video attached');
    }

    this.service.activate();
    this.logger.info('Normalizer activated via use case');
  }
}
