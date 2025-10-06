(() => {
  'use strict';

  // =========================================================================
  // === PARTE 1: CLICADOR DE BOTÃO AUTOMÁTICO (WATCHER) ===
  // =========================================================================
  const skipButtonSelector = '[data-uia="player-skip-intro"]';
  const observer = new MutationObserver(() => {
    const skipButton = document.querySelector(skipButtonSelector);
    if (skipButton) {
      console.log('🔘 Botão "Pular Abertura" encontrado, clicando...');
      skipButton.click();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('✅ Clicador de botão automático ativado com seletor robusto.');

  // =========================================================================
  // === PARTE 2: NORMALIZADOR DE ÁUDIO ===
  // =========================================================================

  // --- CONFIGURAÇÕES DO NORMALIZADOR ---
  const mediaSelector = 'video';
  const initialTargetLevel = 0.1;
  const initialSmoothing = 0.05;
  const useCompressor = true;
  const MAX_GAIN = 8.0; // NOVO: Limite máximo de ganho para evitar picos. (8x o volume original)

  // --- VARIÁVEIS DE ESTADO DO NORMALIZADOR ---
  let audioContext;
  let gainNode;
  let analyserNode;
  let sourceNode;
  let animationFrameId = null;
  let isActive = false;
  let timeDomainData;

  // --- ELEMENTOS DO NORMALIZADOR ---
  const mediaElement = document.querySelector(mediaSelector);
  if (!mediaElement) {
    console.warn('🎧 Nenhum elemento de vídeo encontrado para o normalizador.');
  }

  // --- INICIALIZAÇÃO DO ÁUDIO ---
  function setupAudio() {
    if (audioContext || !mediaElement) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioContext.createMediaElementSource(mediaElement);
      gainNode = audioContext.createGain();
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 512;
      timeDomainData = new Float32Array(analyserNode.fftSize);

      let currentNode = sourceNode.connect(gainNode);

      if (useCompressor) {
        const compressorNode = audioContext.createDynamicsCompressor();
        // ... (configurações do compressor)
        currentNode = currentNode.connect(compressorNode);
      }

      currentNode.connect(audioContext.destination);
      gainNode.connect(analyserNode);

      // NOVO: Adiciona um listener para o evento 'seeking' (quando o usuário pula o vídeo)
      mediaElement.addEventListener('seeking', () => {
        // Se o normalizador estiver ativo, redefine o ganho para 1 (neutro) para evitar picos.
        if (isActive && gainNode) {
          console.log('🎥 Vídeo pulado! Resetando o ganho para 1.0.');
          // Usamos setTargetAtTime para uma mudança suave, mas um valor direto também funciona.
          gainNode.gain.setTargetAtTime(1.0, audioContext.currentTime, 0.05);
        }
      });

    } catch (e) {
      console.error("Erro ao inicializar a Web Audio API:", e);
    }
  }

  // --- UI DO NORMALIZADOR ---
  function createUI() {
    const panel = document.createElement('div');
    panel.style.cssText = `
            position:fixed; bottom:20px; right:20px; z-index:999999;
            background:rgba(0,0,0,0.8); color:#fff; font-family:monospace;
            padding:10px 14px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.5);
            backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
        `;
    panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:4px;">🎚️ Normalizador de Áudio</div>
            <label>Alvo: <input id="volTarget" type="range" min="0.02" max="0.3" step="0.01" value="${initialTargetLevel}" style="width:120px; vertical-align: middle;"></label><br>
            <label>Suavização: <input id="volSmooth" type="range" min="0.01" max="0.3" step="0.01" value="${initialSmoothing}" style="width:120px; vertical-align: middle;"></label><br>
            <button id="volToggle" style="margin-top:6px;width:100%;padding:4px 10px;border:none;border-radius:6px;background:#0a84ff;color:#fff;cursor:pointer;">Ativar</button>
            <div id="volInfo" style="font-size:11px;margin-top:4px;opacity:0.8;text-align:center;">⏸️ Inativo</div>
        `;
    document.body.appendChild(panel);
    return {
      targetSlider: panel.querySelector('#volTarget'),
      smoothSlider: panel.querySelector('#volSmooth'),
      toggleBtn: panel.querySelector('#volToggle'),
      info: panel.querySelector('#volInfo')
    };
  }

  const ui = createUI();

  // --- LÓGICA DE NORMALIZAÇÃO ---
  function getAverageVolume(array) {
    let sumOfSquares = 0;
    for (let i = 0; i < array.length; i++) {
      sumOfSquares += array[i] * array[i];
    }
    return Math.sqrt(sumOfSquares / array.length);
  }

  function normalize() {
    if (!isActive) return;

    analyserNode.getFloatTimeDomainData(timeDomainData);
    const volume = getAverageVolume(timeDomainData);

    // Se o volume for muito baixo (praticamente silêncio), não faz nada neste quadro.
    // Isso ajuda a evitar que o ganho suba durante pausas.
    if (volume < 0.001) {
      animationFrameId = requestAnimationFrame(normalize);
      return;
    }

    const targetLevel = parseFloat(ui.targetSlider.value);
    const smoothing = parseFloat(ui.smoothSlider.value);

    const desiredGain = targetLevel / (volume + 0.0001);

    // Calcula o próximo valor de ganho com suavização
    let newGain = gainNode.gain.value + (desiredGain - gainNode.gain.value) * smoothing;

    // NOVO: Aplica o limite de segurança (clamp)
    newGain = Math.min(MAX_GAIN, newGain);

    gainNode.gain.value = newGain;

    ui.info.textContent = `🔊 Gain: ${gainNode.gain.value.toFixed(2)} | Vol: ${volume.toFixed(3)}`;
    animationFrameId = requestAnimationFrame(normalize);
  }

  // --- CONTROLE DE ATIVAÇÃO ---
  ui.toggleBtn.addEventListener('click', () => {
    isActive = !isActive;
    if (!audioContext) {
      setupAudio();
    }
    if (isActive && audioContext) {
      audioContext.resume();
      ui.toggleBtn.textContent = 'Desativar';
      ui.info.textContent = '🎧 Ativo...';
      normalize();
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      ui.toggleBtn.textContent = 'Ativar';
      ui.info.textContent = '⏸️ Inativo';
    }
  });

  console.log('✅ Normalizador de áudio (com proteção contra picos) injetado com sucesso!');

})();
