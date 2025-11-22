import { AudioGraphBuilder } from './AudioGraphBuilder';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { AudioMetrics } from '../../domain/value-objects/AudioMetrics';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
   * Web Audio API adapter with value object abstractions.
   */
export class WebAudioAdapter {
  private graphBuilder: AudioGraphBuilder;

  constructor(logger: ILogger) {
    this.graphBuilder = new AudioGraphBuilder(logger);
  }

  public attachToVideo(video: HTMLVideoElement): void {
    this.graphBuilder.initialize(video);
  }

  public setActive(isActive: boolean): void {
    this.graphBuilder.connect(isActive);
  }

  public async resume(): Promise<void> {
    await this.graphBuilder.resume();
  }

  public setGain(gain: GainValue): void {
    const gainNode = this.graphBuilder.getGainNode();
    gainNode.setGain(gain);
  }

  public setGainSmooth(gain: GainValue, timeConstant: number = 0.05): void {
    const gainNode = this.graphBuilder.getGainNode();
    gainNode.setGainSmooth(gain, timeConstant);
  }

  public getCurrentGain(): GainValue {
    const gainNode = this.graphBuilder.getGainNode();
    return gainNode.getCurrentGain();
  }

  public measureVolume(): VolumeLevel {
    const analyserNode = this.graphBuilder.getAnalyserNode();
    return analyserNode.measureVolume();
  }

  public getMetrics(): AudioMetrics {
    const volume = this.measureVolume();
    const gain = this.getCurrentGain();
    return new AudioMetrics(volume, gain);
  }

  public cleanup(): void {
    this.graphBuilder.cleanup();
  }

  public isInitialized(): boolean {
    return this.graphBuilder.isInitialized();
  }

  public hasMediaElement(): boolean {
    return this.graphBuilder.hasMediaElement();
  }
}
