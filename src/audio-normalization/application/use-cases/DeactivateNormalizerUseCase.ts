import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
 * Use Case: Desativar Normalizador
 *
 * Responsabilidade:
 * - Desativar o normalizador de áudio
 */
export class DeactivateNormalizerUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly logger: ILogger
  ) {}

  public execute(): void {
    this.service.deactivate();
    this.logger.info('Normalizer deactivated via use case');
  }
}
