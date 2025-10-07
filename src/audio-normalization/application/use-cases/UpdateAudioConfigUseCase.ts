import { AudioNormalizationService } from '../../infrastructure/AudioNormalizationService';
import { AudioConfig } from '../../domain/value-objects/AudioConfig';
import { AudioConfigDTO } from '../dto/AudioConfigDTO';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';
import { IConfigRepository } from '../../../shared/infrastructure/storage/IConfigRepository';

/**
 * Use Case: Atualizar Configuração de Áudio
 *
 * Responsabilidades:
 * - Validar nova configuração
 * - Atualizar persistência
 * - Atualizar serviço de normalização
 */
export class UpdateAudioConfigUseCase {
  constructor(
    private readonly service: AudioNormalizationService,
    private readonly repository: IConfigRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(configDTO: Partial<AudioConfigDTO>): Promise<void> {
    // Carrega configuração atual
    const currentConfig = await this.repository.load();

    // Mescla com novos valores
    const updatedPrimitives = {
      targetLevel: configDTO.targetLevel ?? currentConfig.targetLevel,
      maxGain: configDTO.maxGain ?? currentConfig.maxGain,
      minGain: configDTO.minGain ?? currentConfig.minGain,
    };

    // Cria AudioConfig validado
    const audioConfig = AudioConfig.fromPrimitives(
      updatedPrimitives.targetLevel,
      updatedPrimitives.maxGain,
      updatedPrimitives.minGain
    );

    // Salva no repository
    await this.repository.update(updatedPrimitives);

    // Atualiza o serviço
    this.service.updateConfig(audioConfig);

    this.logger.info('Audio configuration updated via use case', updatedPrimitives);
  }
}
