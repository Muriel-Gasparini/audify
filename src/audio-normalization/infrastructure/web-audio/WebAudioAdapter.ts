import { AudioGraphBuilder } from './AudioGraphBuilder';
import { GainValue } from '../../../shared/domain/value-objects/GainValue';
import { VolumeLevel } from '../../../shared/domain/value-objects/VolumeLevel';
import { AudioMetrics } from '../../domain/value-objects/AudioMetrics';
import { ILogger } from '../../../shared/infrastructure/logger/ILogger';

/**
 * Web Audio Adapter
 * Adapter para a Web Audio API
 *
 * Responsabilidades:
 * - Interface simplificada para o domínio
 * - Encapsula complexidade da Web Audio API
 * - Fornece abstrações usando Value Objects
 */
export class WebAudioAdapter {
  private graphBuilder: AudioGraphBuilder;

  constructor(logger: ILogger) {
    this.graphBuilder = new AudioGraphBuilder(logger);
  }

  /**
   * Conecta o adapter a um elemento de vídeo
   */
  public attachToVideo(video: HTMLVideoElement): void {
    this.graphBuilder.initialize(video);
  }

  /**
   * Ativa ou desativa o processamento
   */
  public setActive(isActive: boolean): void {
    this.graphBuilder.connect(isActive);
  }

  /**
   * Resume o AudioContext se necessário
   */
  public async resume(): Promise<void> {
    await this.graphBuilder.resume();
  }

  /**
   * Define o valor de gain
   */
  public setGain(gain: GainValue): void {
    const gainNode = this.graphBuilder.getGainNode();
    gainNode.setGain(gain);
  }

  /**
   * Define o gain com suavização
   */
  public setGainSmooth(gain: GainValue, timeConstant: number = 0.05): void {
    const gainNode = this.graphBuilder.getGainNode();
    gainNode.setGainSmooth(gain, timeConstant);
  }

  /**
   * Obtém o gain atual
   */
  public getCurrentGain(): GainValue {
    const gainNode = this.graphBuilder.getGainNode();
    return gainNode.getCurrentGain();
  }

  /**
   * Mede o volume atual
   */
  public measureVolume(): VolumeLevel {
    const analyserNode = this.graphBuilder.getAnalyserNode();
    return analyserNode.measureVolume();
  }

  /**
   * Obtém métricas atuais do áudio
   */
  public getMetrics(): AudioMetrics {
    const volume = this.measureVolume();
    const gain = this.getCurrentGain();
    return new AudioMetrics(volume, gain);
  }

  /**
   * Limpa todos os recursos
   */
  public cleanup(): void {
    this.graphBuilder.cleanup();
  }

  public isInitialized(): boolean {
    return this.graphBuilder.isInitialized();
  }
}
