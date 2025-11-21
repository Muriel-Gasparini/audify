import { ContentScriptFacade } from './ContentScriptFacade';

/**
   * Content script entry point.
   */

function isValidExecutionContext(): boolean {
  if (window.origin === 'null') {
    return false;
  }

  if (window.location.href === 'about:blank' || window.location.href === 'about:srcdoc') {
    return false;
  }

  if (window.location.protocol === 'data:') {
    return false;
  }

  try {
    if (!chrome?.runtime?.id) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

function isTopFrame(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

if (!isValidExecutionContext()) {
} else {
  const frameType = isTopFrame() ? 'TOP FRAME' : 'IFRAME';
  console.log(`[Netfrix] Content script loaded in ${frameType} - starting initialization`);

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
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
