/**
 * Data Transfer Object: AudioStateDTO
 * Representa o estado atual do normalizador
 *
 * Usado para comunicação com a UI
 */
export interface AudioStateDTO {
  gain: number;
  volume: number;
  isActive: boolean;
  hasVideo: boolean;
}
