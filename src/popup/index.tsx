import React from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionProvider } from './contexts/ExtensionContext';
import { App } from './App';
import './styles/global.css';

/**
 * Popup Entry Point
 * Inicializa a aplicação React do popup
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ExtensionProvider>
      <App />
    </ExtensionProvider>
  </React.StrictMode>
);
