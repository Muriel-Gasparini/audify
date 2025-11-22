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

if (!isValidExecutionContext()) {
} else {
  (async () => {
    try {
      const facade = new ContentScriptFacade();
      await facade.initialize();
    } catch (error) {
    }
  })();
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
