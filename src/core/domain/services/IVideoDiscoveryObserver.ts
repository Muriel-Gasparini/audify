import { GenericVideo } from '../entities/GenericVideo';

/**
 * Interface para observadores de descoberta de vídeo
 */
export interface IVideoDiscoveryObserver {
  /**
   * Chamado quando um novo vídeo é descoberto
   */
  onVideoDiscovered(video: GenericVideo): void;

  /**
   * Chamado quando um vídeo é removido
   */
  onVideoRemoved?(video: GenericVideo): void;
}
