import {
  NormalizerConfig,
  AudioState,
  Message,
  GetConfigResponse,
  SetConfigData,
  GetStateResponse,
} from './types';
import { loadConfig, updateConfig } from './storage';

// ============================================================================
// PARTE 1: AUTO-SKIP INTRO BUTTON
// ============================================================================

function setupAutoSkip(): void {
  const skipButtonSelector = '[data-uia="player-skip-intro"]';

  const observer = new MutationObserver(() => {
    const skipButton = document.querySelector(skipButtonSelector);
    if (skipButton instanceof HTMLElement) {
      console.log('🔘 Botão "Pular Abertura" encontrado, clicando...');
      skipButton.click();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log('✅ Auto-skip ativado');
}

// ============================================================================
// PARTE 2: AUDIO NORMALIZER
// ============================================================================

class AudioNormalizer {
  private config: NormalizerConfig;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private timeDomainData: Float32Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private mediaElement: HTMLVideoElement | null = null;

  constructor(config: NormalizerConfig) {
    this.config = config;
  }

  public setConfig(newConfig: Partial<NormalizerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Se foi toggle do isActive
    if ('isActive' in newConfig) {
      if (newConfig.isActive) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  public getState(): AudioState {
    return {
      gain: this.gainNode?.gain.value ?? 1.0,
      volume: 0, // será atualizado no loop de normalização
      isActive: this.config.isActive,
    };
  }

  public attachToVideo(video: HTMLVideoElement): void {
    if (this.mediaElement === video) {
      return; // Já está conectado a este vídeo
    }

    console.log('🎧 Conectando ao elemento de vídeo...');
    this.mediaElement = video;
    this.cleanup();
    this.setupAudio();

    if (this.config.isActive) {
      this.start();
    }
  }

  private setupAudio(): void {
    if (!this.mediaElement || this.audioContext) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.sourceNode = this.audioContext.createMediaElementSource(this.mediaElement);
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.timeDomainData = new Float32Array(this.analyserNode.fftSize);

      let currentNode: AudioNode = this.sourceNode.connect(this.gainNode);

      // Compressor
      const compressorNode = this.audioContext.createDynamicsCompressor();
      compressorNode.threshold.value = -24;
      compressorNode.knee.value = 30;
      compressorNode.ratio.value = 12;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;
      currentNode = currentNode.connect(compressorNode);

      currentNode.connect(this.audioContext.destination);
      this.gainNode.connect(this.analyserNode);

      // Reset gain on seeking
      this.mediaElement.addEventListener('seeking', () => {
        if (this.config.isActive && this.gainNode && this.audioContext) {
          console.log('🎥 Vídeo pulado! Resetando o ganho para 1.0.');
          this.gainNode.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.05);
        }
      });

      console.log('✅ Audio context inicializado');
    } catch (error) {
      console.error('Erro ao inicializar a Web Audio API:', error);
    }
  }

  private start(): void {
    if (!this.audioContext) {
      this.setupAudio();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (!this.animationFrameId) {
      this.normalize();
    }

    console.log('🎧 Normalizer ativado');
  }

  private stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('⏸️ Normalizer desativado');
  }

  private normalize = (): void => {
    if (!this.config.isActive || !this.analyserNode || !this.timeDomainData || !this.gainNode) {
      return;
    }

    this.analyserNode.getFloatTimeDomainData(this.timeDomainData);
    const volume = this.getAverageVolume(this.timeDomainData);

    // Ignora silêncio
    if (volume < 0.001) {
      this.animationFrameId = requestAnimationFrame(this.normalize);
      return;
    }

    const desiredGain = this.config.targetLevel / (volume + 0.0001);
    let newGain =
      this.gainNode.gain.value + (desiredGain - this.gainNode.gain.value) * this.config.smoothing;

    // Clamp
    newGain = Math.min(this.config.maxGain, newGain);
    this.gainNode.gain.value = newGain;

    this.animationFrameId = requestAnimationFrame(this.normalize);
  };

  private getAverageVolume(array: Float32Array<ArrayBuffer>): number {
    let sumOfSquares = 0;
    for (let i = 0; i < array.length; i++) {
      sumOfSquares += array[i] * array[i];
    }
    return Math.sqrt(sumOfSquares / array.length);
  }

  private cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.analyserNode = null;
    this.sourceNode = null;
    this.timeDomainData = null;
  }
}

// ============================================================================
// VIDEO DETECTION & WATCHER
// ============================================================================

let normalizer: AudioNormalizer | null = null;

function detectAndAttachVideo(): void {
  const video = document.querySelector('video');
  if (video instanceof HTMLVideoElement && normalizer) {
    normalizer.attachToVideo(video);
  }
}

function watchForVideo(): void {
  const observer = new MutationObserver(() => {
    detectAndAttachVideo();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Tenta conectar imediatamente
  detectAndAttachVideo();

  console.log('✅ Video watcher ativado');
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GetConfigResponse | GetStateResponse | { success: boolean }) => void
  ) => {
    (async () => {
      try {
        switch (message.type) {
          case 'GET_CONFIG': {
            const config = await loadConfig();
            sendResponse({ config });
            break;
          }

          case 'SET_CONFIG': {
            const data = message.data as SetConfigData;
            const updatedConfig = await updateConfig(data);
            if (normalizer) {
              normalizer.setConfig(updatedConfig);
            }
            sendResponse({ success: true });
            break;
          }

          case 'GET_STATE': {
            const state = normalizer?.getState() ?? {
              gain: 1.0,
              volume: 0,
              isActive: false,
            };
            sendResponse({ state });
            break;
          }

          case 'TOGGLE_NORMALIZER': {
            const currentConfig = await loadConfig();
            const newIsActive = !currentConfig.isActive;
            const updatedConfig = await updateConfig({ isActive: newIsActive });
            if (normalizer) {
              normalizer.setConfig(updatedConfig);
            }
            sendResponse({ success: true });
            break;
          }

          default:
            sendResponse({ success: false });
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false });
      }
    })();

    return true; // Mantém o canal aberto para resposta assíncrona
  }
);

// ============================================================================
// INITIALIZATION
// ============================================================================

(async () => {
  const config = await loadConfig();
  normalizer = new AudioNormalizer(config);

  setupAutoSkip();
  watchForVideo();

  console.log('✅ Netflix Audio Normalizer & Auto Skip carregado');
})();

// ============================================================================
// TYPE AUGMENTATION
// ============================================================================

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
