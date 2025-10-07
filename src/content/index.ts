import { ContentScriptFacade } from './ContentScriptFacade';

/**
 * Content Script Entry Point
 * Inicializa a extensão quando carregada no Netflix
 */
console.log('[Netfrix] Content script loaded - starting initialization');

(async () => {
  try {
    console.log('[Netfrix] Creating ContentScriptFacade...');
    const facade = new ContentScriptFacade();

    console.log('[Netfrix] Initializing facade...');
    await facade.initialize();

    console.log('[Netfrix] Initialization completed successfully!');
  } catch (error) {
    console.error('[Netfrix] Fatal error during initialization:', error);
  }
})();

// Declaração global para webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
