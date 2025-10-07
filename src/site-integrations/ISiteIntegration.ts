import { GenericVideo } from '../core/domain/entities/GenericVideo';

/**
 * Interface para integrações específicas de sites (OPCIONAIS)
 *
 * IMPORTANTE:
 * - Integrações são OPCIONAIS, não obrigatórias
 * - Use apenas quando o site precisa de features ESPECÍFICAS além da normalização
 * - VideoDiscoveryService já encontra vídeos automaticamente em qualquer site
 * - AudioNormalizationService já normaliza áudio automaticamente
 *
 * Quando criar uma integração:
 * - Site tem botões específicos (ex: Netflix skip intro)
 * - Site precisa de lógica customizada de UI
 * - Site tem comportamentos únicos que queremos automatizar
 *
 * Quando NÃO criar:
 * - Site genérico com player HTML5 padrão
 * - Apenas precisa de normalização de áudio (já funciona automaticamente)
 * - Não tem features específicas para automatizar
 *
 * Exemplos de integrações úteis:
 * - Netflix: Auto-skip de intros/recaps/créditos
 * - YouTube: Pular anúncios automaticamente
 * - Twitch: Features específicas de chat/stream
 */
export interface ISiteIntegration {
  /**
   * Nome da integração (ex: "Netflix", "YouTube")
   */
  getName(): string;

  /**
   * Hostnames suportados por esta integração
   * Ex: ["netflix.com", "www.netflix.com"]
   */
  getSupportedHostnames(): string[];

  /**
   * Inicializa a integração
   */
  initialize(): void;

  /**
   * Chamado quando um vídeo é detectado
   * Permite a integração processar o vídeo de forma específica
   */
  onVideoDetected?(video: GenericVideo): void;

  /**
   * Limpa recursos da integração
   */
  cleanup(): void;

  /**
   * Verifica se a integração está ativa
   */
  isActive(): boolean;
}
