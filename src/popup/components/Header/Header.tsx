import React from 'react';

interface HeaderProps {
  integrationName?: string | null;
}

export function Header({ integrationName }: HeaderProps) {
  const subtitle = integrationName
    ? `Active on ${integrationName}`
    : 'Smart audio normalization';

  return (
    <header className="header">
      <h1>Audify</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  );
}
