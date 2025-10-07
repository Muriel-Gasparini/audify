import React, { createContext, useContext, ReactNode } from 'react';
import { PopupMessagingService } from '../services/PopupMessagingService';

/**
 * Extension Context
 * Fornece serviços compartilhados para toda a aplicação
 */
interface ExtensionContextValue {
  messagingService: PopupMessagingService;
}

const ExtensionContext = createContext<ExtensionContextValue | null>(null);

interface ExtensionProviderProps {
  children: ReactNode;
}

export function ExtensionProvider({ children }: ExtensionProviderProps) {
  const messagingService = new PopupMessagingService();

  return (
    <ExtensionContext.Provider value={{ messagingService }}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtension(): ExtensionContextValue {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtension must be used within ExtensionProvider');
  }
  return context;
}
