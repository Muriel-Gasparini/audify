import { Message, GetStateResponse } from './types';
import { loadConfig, saveConfig } from './storage';

// ============================================================================
// DOM Elements
// ============================================================================

const targetSlider = document.getElementById('targetSlider') as HTMLInputElement;
const targetValue = document.getElementById('targetValue') as HTMLSpanElement;
const smoothingSlider = document.getElementById('smoothingSlider') as HTMLInputElement;
const smoothingValue = document.getElementById('smoothingValue') as HTMLSpanElement;
const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const gainText = document.getElementById('gainText') as HTMLSpanElement;

// ============================================================================
// Helpers
// ============================================================================

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

    targetSlider.value = config.targetLevel.toString();
    targetValue.textContent = config.targetLevel.toFixed(2);

    smoothingSlider.value = config.smoothing.toString();
    smoothingValue.textContent = config.smoothing.toFixed(2);

    toggleBtn.textContent = config.isActive ? 'Desativar' : 'Ativar';
    toggleBtn.style.backgroundColor = config.isActive ? '#ff3b30' : '#0a84ff';

    statusText.textContent = config.isActive ? '🎧 Ativo' : '⏸️ Inativo';

    // Tenta obter o estado atual do content script
    try {
      const stateResponse = await sendMessageToActiveTab<GetStateResponse>({
        type: 'GET_STATE',
      });
      gainText.textContent = `Gain: ${stateResponse.state.gain.toFixed(2)}x`;
    } catch {
      gainText.textContent = 'Gain: --';
    }
  } catch (error) {
    console.error('Error updating UI:', error);
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

targetSlider.addEventListener('input', async () => {
  const value = parseFloat(targetSlider.value);
  targetValue.textContent = value.toFixed(2);

  const config = await loadConfig();
  const updatedConfig = { ...config, targetLevel: value };
  await saveConfig(updatedConfig);

  await sendMessageToActiveTab<{ success: boolean }, { targetLevel: number }>({
    type: 'SET_CONFIG',
    data: { targetLevel: value }
  });
});

smoothingSlider.addEventListener('input', async () => {
  const value = parseFloat(smoothingSlider.value);
  smoothingValue.textContent = value.toFixed(2);

  const config = await loadConfig();
  const updatedConfig = { ...config, smoothing: value };
  await saveConfig(updatedConfig);

  await sendMessageToActiveTab<{ success: boolean }, { smoothing: number }>({
    type: 'SET_CONFIG',
    data: { smoothing: value }
  });
});

toggleBtn.addEventListener('click', async () => {
  try {
    await sendMessageToActiveTab({ type: 'TOGGLE_NORMALIZER' });
    await updateUI();
  } catch (error) {
    console.error('Error toggling normalizer:', error);
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
