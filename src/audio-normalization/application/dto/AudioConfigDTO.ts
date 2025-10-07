/**
 * Data Transfer Object: AudioConfigDTO
 * Representa configuração de áudio em formato primitivo
 *
 * Usado na fronteira da aplicação (UI, API, Storage)
 */
export interface AudioConfigDTO {
  targetLevel: number;
  maxGain: number;
  minGain: number;
}
