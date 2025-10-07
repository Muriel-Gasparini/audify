import React from 'react';

interface HeaderProps {
  integrationName?: string | null;
}

/**
 * Componente: Header
 * Cabeçalho do popup
 *
 * Exibe título personalizado baseado na integração ativa:
 * - Sites com integração específica (ex: Netflix): mostra nome da integração
 * - Sites sem integração (modo genérico): mostra título genérico
 */
export function Header({ integrationName }: HeaderProps) {
  const title = integrationName
    ? `${integrationName} Audio Normalizer`
    : 'Audio Normalizer';

  return (
    <header className="header">
      <h1>{title}</h1>
      <p className="subtitle">Controle automático de volume</p>
    </header>
  );
}
