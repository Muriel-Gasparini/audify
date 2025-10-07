import { Message, GetStateResponse } from './types';
import { loadConfig, saveConfig } from './storage';

// ============================================================================
// DOM Elements
// ============================================================================

const targetSlider = document.getElementById('targetSlider') as HTMLInputElement;
const targetValue = document.getElementById('targetValue') as HTMLSpanElement;
const maxGainSlider = document.getElementById('maxGainSlider') as HTMLInputElement;
const maxGainValue = document.getElementById('maxGainValue') as HTMLSpanElement;
const minGainSlider = document.getElementById('minGainSlider') as HTMLInputElement;
const minGainValue = document.getElementById('minGainValue') as HTMLSpanElement;
const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const gainText = document.getElementById('gainText') as HTMLSpanElement;

// ============================================================================
// Helpers
// ============================================================================

async function isOnNetflix(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url) {
        resolve(false);
        return;
      }
      resolve(activeTab.url.includes('netflix.com'));
    });
  });
}

async function sendMessageToActiveTab<T, D = Record<string, never>>(message: Message<D>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        reject(new Error('No active tab found'));
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, message, (response: T) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  });
}

// ============================================================================
// UI Update Functions
// ============================================================================

async function updateUI(): Promise<void> {
  try {
    const config = await loadConfig();
    const onNetflix = await isOnNetflix();

    targetSlider.value = config.targetLevel.toString();
    targetValue.textContent = config.targetLevel.toFixed(2);

    maxGainSlider.value = config.maxGain.toString();
    maxGainValue.textContent = `${config.maxGain.toFixed(1)}x`;

    minGainSlider.value = config.minGain.toString();
    minGainValue.textContent = `${config.minGain.toFixed(2)}x`;

    // Ajusta botão baseado no contexto
    if (onNetflix) {
      // Está na Netflix - verifica se tem vídeo
      try {
        const stateResponse = await sendMessageToActiveTab<GetStateResponse>({
          type: 'GET_STATE',
        });

        const hasVideo = stateResponse.state.hasVideo;

        if (!hasVideo) {
          // Na Netflix mas SEM vídeo
          toggleBtn.textContent = 'Buscando vídeo...';
          toggleBtn.disabled = true;
          toggleBtn.style.backgroundColor = '#666';
          statusText.textContent = '🔍 Buscando vídeo...';
          gainText.textContent = 'Gain: --';

          // Desabilita controles
          targetSlider.disabled = true;
          maxGainSlider.disabled = true;
          minGainSlider.disabled = true;
        } else {
          // Na Netflix COM vídeo
          toggleBtn.textContent = config.isActive ? 'Desativar' : 'Ativar';
          toggleBtn.disabled = false;
          toggleBtn.style.backgroundColor = config.isActive ? '#ff3b30' : '#0a84ff';
          statusText.textContent = config.isActive ? '🎧 Ativo' : '⏸️ Inativo';
          gainText.textContent = `Gain: ${stateResponse.state.gain.toFixed(2)}x`;

          // Habilita controles
          targetSlider.disabled = false;
          maxGainSlider.disabled = false;
          minGainSlider.disabled = false;
        }
      } catch {
        // Erro ao comunicar com content script
        toggleBtn.textContent = 'Erro';
        toggleBtn.disabled = true;
        statusText.textContent = '❌ Erro de comunicação';
        gainText.textContent = 'Gain: --';

        targetSlider.disabled = true;
        maxGainSlider.disabled = true;
        minGainSlider.disabled = true;
      }
    } else {
      // Fora da Netflix
      toggleBtn.textContent = 'Ir para Netflix';
      toggleBtn.disabled = false;
      toggleBtn.style.backgroundColor = '#0a84ff';
      statusText.textContent = '📺 Não está no Netflix';
      gainText.textContent = 'Gain: --';

      // Desabilita controles
      targetSlider.disabled = true;
      maxGainSlider.disabled = true;
      minGainSlider.disabled = true;
    }
  } catch (error) {
    console.error('Error updating UI:', error);
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

// Atualiza visualmente enquanto arrasta
targetSlider.addEventListener('input', () => {
  targetValue.textContent = parseFloat(targetSlider.value).toFixed(2);
});

// Salva apenas quando solta o slider
targetSlider.addEventListener('change', async () => {
  const value = parseFloat(targetSlider.value);

  const config = await loadConfig();
  const updatedConfig = { ...config, targetLevel: value };
  await saveConfig(updatedConfig);

  const onNetflix = await isOnNetflix();
  if (onNetflix) {
    try {
      await sendMessageToActiveTab<{ success: boolean }, { targetLevel: number }>({
        type: 'SET_CONFIG',
        data: { targetLevel: value }
      });
    } catch (error) {
      console.error('Error sending config to content script:', error);
    }
  }
});

// Atualiza visualmente enquanto arrasta
maxGainSlider.addEventListener('input', () => {
  maxGainValue.textContent = `${parseFloat(maxGainSlider.value).toFixed(1)}x`;
});

// Salva apenas quando solta o slider
maxGainSlider.addEventListener('change', async () => {
  const value = parseFloat(maxGainSlider.value);

  const config = await loadConfig();
  const updatedConfig = { ...config, maxGain: value };
  await saveConfig(updatedConfig);

  const onNetflix = await isOnNetflix();
  if (onNetflix) {
    try {
      await sendMessageToActiveTab<{ success: boolean }, { maxGain: number }>({
        type: 'SET_CONFIG',
        data: { maxGain: value }
      });
    } catch (error) {
      console.error('Error sending config to content script:', error);
    }
  }
});

// Atualiza visualmente enquanto arrasta
minGainSlider.addEventListener('input', () => {
  minGainValue.textContent = `${parseFloat(minGainSlider.value).toFixed(2)}x`;
});

// Salva apenas quando solta o slider
minGainSlider.addEventListener('change', async () => {
  const value = parseFloat(minGainSlider.value);

  const config = await loadConfig();
  const updatedConfig = { ...config, minGain: value };
  await saveConfig(updatedConfig);

  const onNetflix = await isOnNetflix();
  if (onNetflix) {
    try {
      await sendMessageToActiveTab<{ success: boolean }, { minGain: number }>({
        type: 'SET_CONFIG',
        data: { minGain: value }
      });
    } catch (error) {
      console.error('Error sending config to content script:', error);
    }
  }
});

toggleBtn.addEventListener('click', async () => {
  const onNetflix = await isOnNetflix();

  if (onNetflix) {
    // Está na Netflix: toggle normalizer
    try {
      await sendMessageToActiveTab({ type: 'TOGGLE_NORMALIZER' });
      await updateUI();
    } catch (error) {
      console.error('Error toggling normalizer:', error);
    }
  } else {
    // Não está na Netflix: abre Netflix
    chrome.tabs.create({ url: 'https://www.netflix.com' });
  }
});

// ============================================================================
// Initialization
// ============================================================================

updateUI();

// Atualiza o estado a cada 500ms quando ativo
setInterval(async () => {
  const config = await loadConfig();
  if (config.isActive) {
    try {
      const stateResponse = await sendMessageToActiveTab<GetStateResponse>({
        type: 'GET_STATE',
      });
      gainText.textContent = `Gain: ${stateResponse.state.gain.toFixed(2)}x`;
    } catch {
      // Ignora erros silenciosamente
    }
  }
}, 500);
