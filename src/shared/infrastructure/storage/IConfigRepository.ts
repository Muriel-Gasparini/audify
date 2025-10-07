/**
 * Configuração do normalizador (Domain Model)
 */
export interface NormalizerConfig {
  targetLevel: number;
  maxGain: number;
  minGain: number;
  isActive: boolean;
}

/**
 * Interface de Repository para configurações (Port)
 *
 * Abstração para persistência de configurações
 * Permite trocar chrome.storage por localStorage, IndexedDB, etc.
 */
export interface IConfigRepository {
  /**
   * Carrega a configuração salva
   * Retorna configuração padrão se não existir
   */
  load(): Promise<NormalizerConfig>;

  /**
   * Salva a configuração completa
   */
  save(config: NormalizerConfig): Promise<void>;

  /**
   * Atualiza parcialmente a configuração
   */
  update(partialConfig: Partial<NormalizerConfig>): Promise<NormalizerConfig>;
}
