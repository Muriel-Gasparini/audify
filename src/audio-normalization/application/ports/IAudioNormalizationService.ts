import { AudioConfig } from '../../domain/value-objects/AudioConfig';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';

export interface IAudioNormalizationService {
  attachToVideo(video: HTMLVideoElement): void;

  activate(): void;

  deactivate(): void;

  updateConfig(config: AudioConfig): void;

  getCurrentGain(): GainValue;

  hasVideoAttached(): boolean;

  isNormalizerActive(): boolean;

  cleanup(): void;
}
