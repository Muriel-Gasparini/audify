import { CommandHandler } from '../commands/Command';
import { ToggleNormalizerCommand } from '../commands/ToggleNormalizerCommand';
import { ActivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/ActivateNormalizerUseCase';
import { DeactivateNormalizerUseCase } from '../../../../audio-normalization/application/use-cases/DeactivateNormalizerUseCase';
import { IConfigRepository } from '../../storage/IConfigRepository';
import { ILogger } from '../../logger/ILogger';

/**
 * Handler: Toggle Normalizador
 *
 * Gerencia o toggle do normalizador com suporte a ativação diferida:
 * - Se vídeo disponível: ativa/desativa imediatamente
 * - Se vídeo indisponível: persiste estado e ativará quando vídeo for descoberto
 *
 * IMPORTANTE: Este handler NUNCA lança exceções. O caso de "sem vídeo" é
 * tratado graciosamente através de ativação diferida (deferred activation).
 *
 * Como funciona a ativação diferida:
 * 1. Usuário clica toggle (vídeo ainda não descoberto)
 * 2. ActivateUseCase retorna { success: false, reason: 'NO_VIDEO' }
 * 3. Handler persiste isActive: true na configuração
 * 4. Quando vídeo for descoberto, ContentScriptFacade.onVideoDiscovered
 *    carrega a config e ativa o normalizador automaticamente
 */
export class ToggleNormalizerHandler implements CommandHandler<ToggleNormalizerCommand, void> {
  constructor(
    private readonly activateUseCase: ActivateNormalizerUseCase,
    private readonly deactivateUseCase: DeactivateNormalizerUseCase,
    private readonly configRepository: IConfigRepository,
    private readonly logger: ILogger
  ) {}

  public async handle(_command: ToggleNormalizerCommand): Promise<void> {
    const config = await this.configRepository.load();
    const newIsActive = !config.isActive;

    this.logger.info(`Toggling normalizer: ${config.isActive} -> ${newIsActive}`);

    if (newIsActive) {
      // Tenta ativar
      const result = this.activateUseCase.execute();

      if (result.success) {
        this.logger.info('Normalizer activated immediately');
      } else if (result.reason === 'NO_VIDEO') {
        // Vídeo não disponível - persiste configuração para ativar quando descoberto
        this.logger.info('Video not available yet - activation will be deferred');
        // A configuração será salva abaixo, e ContentScriptFacade.onVideoDiscovered
        // verificará config.isActive para ativar automaticamente quando vídeo aparecer
      } else {
        // ALREADY_ACTIVE
        this.logger.info('Normalizer was already active');
      }
    } else {
      // Desativa
      this.deactivateUseCase.execute();
      this.logger.info('Normalizer deactivated');
    }

    // Persiste o estado (independente de ter vídeo ou não)
    // Isso garante que:
    // - Se vídeo já existe: estado é salvo corretamente
    // - Se vídeo não existe ainda: quando for descoberto, ativará automaticamente
    await this.configRepository.update({ isActive: newIsActive });
    this.logger.info('Configuration updated successfully');
  }
}
