import { AudioConfig } from '../../../audio-normalization/domain/value-objects/AudioConfig';

export interface IConfigRepository {
  load(): Promise<AudioConfig>;

  save(config: AudioConfig): Promise<void>;

  update(partialConfig: Partial<AudioConfig>): Promise<AudioConfig>;
}
