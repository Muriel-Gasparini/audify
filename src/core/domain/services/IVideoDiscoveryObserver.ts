import { GenericVideo } from '../entities/GenericVideo';

/**
   * Video discovery observer interface.
   */
export interface IVideoDiscoveryObserver {
  onVideoDiscovered(video: GenericVideo): void;

  onVideoRemoved?(video: GenericVideo): void;
}
