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
  private compressorNode: DynamicsCompressorNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private timeDomainData: Float32Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private mediaElement: HTMLVideoElement | null = null;

  constructor(config: NormalizerConfig) {
    this.config = config;
    // Validação inicial ao criar o normalizador
    this.validateAndFixConfig();
  }

  private validateAndFixConfig(): void {
    // Validação de segurança: garante valores válidos
    if (this.config.minGain <= 0 || !isFinite(this.config.minGain)) {
      console.warn('⚠️ minGain inválido no constructor:', this.config.minGain, '- resetando para 0.1');
      this.config.minGain = 0.1;
    }
    if (this.config.maxGain <= 0 || !isFinite(this.config.maxGain)) {
      console.warn('⚠️ maxGain inválido no constructor:', this.config.maxGain, '- resetando para 8.0');
      this.config.maxGain = 8.0;
    }
    if (this.config.targetLevel <= 0 || !isFinite(this.config.targetLevel)) {
      console.warn('⚠️ targetLevel inválido no constructor:', this.config.targetLevel, '- resetando para 0.1');
      this.config.targetLevel = 0.1;
    }

    // Garante que minGain < maxGain
    if (this.config.minGain > this.config.maxGain) {
      console.warn('⚠️ minGain > maxGain no constructor, trocando valores');
      [this.config.minGain, this.config.maxGain] = [this.config.maxGain, this.config.minGain];
    }
  }

  public setConfig(newConfig: Partial<NormalizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateAndFixConfig();

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
      hasVideo: this.mediaElement !== null,
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

      // Compressor (mais agressivo para pegar picos)
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -18;  // Age antes (era -24)
      this.compressorNode.knee.value = 10;        // Transição mais brusca (era 30)
      this.compressorNode.ratio.value = 20;       // Comprime mais (era 12)
      this.compressorNode.attack.value = 0.001;   // 3x mais rápido (era 0.003)
      this.compressorNode.release.value = 0.25;

      // Hard Limiter (último recurso contra picos)
      this.limiterNode = this.audioContext.createDynamicsCompressor();
      this.limiterNode.threshold.value = -6;      // Limite absoluto
      this.limiterNode.knee.value = 0;            // Sem transição suave
      this.limiterNode.ratio.value = 20;          // Brick wall
      this.limiterNode.attack.value = 0;          // Instantâneo
      this.limiterNode.release.value = 0.1;

      this.gainNode.connect(this.analyserNode);

      // Conecta a cadeia completa ou direto, dependendo do estado
      this.reconnectAudioGraph();

      // Reset gain on seeking - mas mantém valor baixo se estava reduzido
      this.mediaElement.addEventListener('seeking', () => {
        if (this.config.isActive && this.gainNode && this.audioContext) {
          const currentGain = this.gainNode.gain.value;

          // Se o gain estava muito baixo (cena alta), mantém em um valor médio
          // ao invés de resetar para 1.0 (evita pico ao pular)
          let resetValue: number;
          if (currentGain < 0.3) {
            // Estava em cena alta - reseta para valor médio entre min e 1.0
            resetValue = Math.max(0.5, this.config.minGain * 2);
            console.log('🎥 Vídeo pulado de cena alta! Resetando para:', resetValue.toFixed(2));
          } else {
            // Estava normal - reseta para 1.0
            resetValue = 1.0;
            console.log('🎥 Vídeo pulado! Resetando o ganho para 1.0.');
          }

          // Validação: garante que valores são finitos
          const currentTime = this.audioContext.currentTime;
          if (isFinite(resetValue) && isFinite(currentTime)) {
            this.gainNode.gain.setTargetAtTime(resetValue, currentTime, 0.05);
          } else {
            console.warn('⚠️ Valores inválidos no reset do gain');
          }
        }
      });

      console.log('✅ Audio context inicializado');
    } catch (error) {
      console.error('Erro ao inicializar a Web Audio API:', error);
    }
  }

  private reconnectAudioGraph(): void {
    if (!this.sourceNode || !this.gainNode || !this.compressorNode || !this.limiterNode || !this.audioContext) {
      return;
    }

    // Desconecta tudo primeiro
    try {
      this.sourceNode.disconnect();
      this.gainNode.disconnect();
      this.compressorNode.disconnect();
      this.limiterNode.disconnect();
    } catch (e) {
      // Ignora erros de desconexão
    }

    // Reconecta analyser (sempre ativo para medição)
    this.gainNode.connect(this.analyserNode!);

    if (this.config.isActive) {
      // ATIVO: Conecta toda a cadeia de processamento
      // source → gain → compressor → limiter → destination
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.compressorNode);
      this.compressorNode.connect(this.limiterNode);
      this.limiterNode.connect(this.audioContext.destination);
      console.log('🎧 Áudio processado: source → gain → compressor → limiter → output');
    } else {
      // INATIVO: Conecta direto, SEM processamento
      // source → destination (áudio 100% original)
      this.sourceNode.connect(this.audioContext.destination);
      // Gain conectado mas não está na cadeia (só para medição)
      this.sourceNode.connect(this.gainNode);
      this.gainNode.gain.value = 1.0; // Reseta gain
      console.log('🔇 Áudio original: source → output (bypass)');
    }
  }

  private start(): void {
    if (!this.audioContext) {
      this.setupAudio();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Reconecta graph com processamento ativo
    this.reconnectAudioGraph();

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

    // Reconecta graph em modo bypass (sem processamento)
    this.reconnectAudioGraph();

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

    // Calcula o gain desejado para atingir o targetLevel
    let desiredGain = this.config.targetLevel / (volume + 0.0001);
    const currentGain = this.gainNode.gain.value;

    // NOVA LÓGICA: Se o volume detectado está alto (acima do targetLevel),
    // força o desiredGain para ser NO MÁXIMO o minGain
    // Isso garante que cenas altas SEMPRE vão para minGain, não importa o cálculo
    if (volume > this.config.targetLevel) {
      // Volume alto detectado - limita o desiredGain ao minGain
      desiredGain = Math.min(desiredGain, this.config.minGain);
    }

    // Validação: garante que todos os valores são finitos
    if (!isFinite(desiredGain) || !isFinite(currentGain)) {
      console.warn('⚠️ Gain inválido detectado, pulando frame');
      this.animationFrameId = requestAnimationFrame(this.normalize);
      return;
    }

    // Clamp desiredGain entre minGain e maxGain
    desiredGain = Math.max(this.config.minGain, Math.min(this.config.maxGain, desiredGain));

    // Interpolação linear suave com constante de tempo fixa
    // 0.1 = 10% de mudança por frame (~60fps = convergência em ~100ms)
    const smoothingFactor = 0.1;
    let newGain = currentGain + (desiredGain - currentGain) * smoothingFactor;

    // Validação final: garante que newGain é finito e positivo
    if (!isFinite(newGain) || newGain <= 0) {
      console.warn('⚠️ newGain inválido:', newGain, '- resetando para 1.0');
      newGain = 1.0;
    }

    this.gainNode.gain.value = newGain;

    this.animationFrameId = requestAnimationFrame(this.normalize);
  };

  private getAverageVolume(array: Float32Array<ArrayBuffer>): number {
    let sumOfSquares = 0;
    let peak = 0;

    for (let i = 0; i < array.length; i++) {
      const abs = Math.abs(array[i]);
      sumOfSquares += array[i] * array[i];

      // Detecta pico máximo
      if (abs > peak) {
        peak = abs;
      }
    }

    const rms = Math.sqrt(sumOfSquares / array.length);

    // Se houver pico significativo (>50% acima do RMS), usa o pico
    // Isso pega transientes instantâneos que o RMS não detectaria
    if (peak > rms * 1.5) {
      return peak * 0.7; // Usa 70% do pico para não ser muito agressivo
    }

    return rms;
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
    this.compressorNode = null;
    this.limiterNode = null;
    this.timeDomainData = null;
  }

  public hasVideoAttached(): boolean {
    return this.mediaElement !== null;
  }
}

// ============================================================================
// VIDEO DETECTION & WATCHER
// ============================================================================

let normalizer: AudioNormalizer | null = null;

function detectAndAttachVideo(): boolean {
  const video = document.querySelector('video');
  if (video instanceof HTMLVideoElement && normalizer) {
    // Verifica se o vídeo tem dados carregados
    if (video.readyState >= 2) {
      normalizer.attachToVideo(video);
      return true;
    }
  }
  return false;
}

function watchForVideo(): void {
  const observer = new MutationObserver(() => {
    detectAndAttachVideo();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Tenta conectar imediatamente
  const found = detectAndAttachVideo();

  if (!found) {
    console.log('🔍 Buscando elemento de vídeo...');

    // Retry a cada 2 segundos se não encontrou
    const retryInterval = setInterval(() => {
      const foundNow = detectAndAttachVideo();
      if (foundNow) {
        console.log('✅ Vídeo encontrado e conectado!');
        clearInterval(retryInterval);
      }
    }, 2000);

    // Para de tentar após 30 segundos
    setTimeout(() => clearInterval(retryInterval), 30000);
  } else {
    console.log('✅ Vídeo encontrado imediatamente!');
  }

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
              hasVideo: false,
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
