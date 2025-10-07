import { ContentScriptFacade } from './ContentScriptFacade';

/**
 * Content Script Entry Point
 * Initializes the extension when loaded on any page
 */

/**
 * Validates if the current execution context is suitable for the extension
 * Returns false for sandboxed frames, about:blank, data URLs, etc.
 *
 * This prevents the extension from trying to initialize in contexts where:
 * - Chrome extension APIs are not accessible
 * - Execution is restricted (sandboxed iframes)
 * - There's no meaningful content (about:blank placeholders)
 */
function isValidExecutionContext(): boolean {
  // Check 1: Sandboxed frames have null origin
  // Example: <iframe sandbox> or <iframe sandbox="allow-scripts">
  if (window.origin === 'null') {
    return false;
  }

  // Check 2: Skip about:blank and about:srcdoc frames
  // These are often used as placeholder frames before real content loads
  if (window.location.href === 'about:blank' || window.location.href === 'about:srcdoc') {
    return false;
  }

  // Check 3: Skip data URLs
  // Example: <iframe src="data:text/html,...">
  if (window.location.protocol === 'data:') {
    return false;
  }

  // Check 4: Verify chrome.runtime API is accessible
  // In some contexts (sandboxed frames, restricted pages), chrome APIs are not available
  try {
    if (!chrome?.runtime?.id) {
      return false;
    }
  } catch {
    // Chrome APIs threw an error - context is not valid
    return false;
  }

  return true;
}

/**
 * Checks if this is the top-level frame (main frame, not an iframe)
 */
function isTopFrame(): boolean {
  try {
    return window.self === window.top;
  } catch {
    // Cross-origin iframe - can't access window.top
    return false;
  }
}

// Validate execution context before initializing
// This prevents errors in sandboxed frames, about:blank, etc.
if (!isValidExecutionContext()) {
  // Silently exit - this is expected for sandboxed frames, about:blank, etc.
  // No logging to avoid console pollution in these contexts
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

// Global type declarations
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
