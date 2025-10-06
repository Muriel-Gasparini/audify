# Netflix Audio Normalizer & Auto Skip

Extensão para Chrome/Edge que adiciona duas funcionalidades ao Netflix:

## ✨ Funcionalidades

1. **🎚️ Normalizador de Áudio**
   - Normaliza automaticamente o volume do áudio para evitar picos muito altos
   - Painel flutuante com controles de ajuste fino (alvo e suavização)
   - Compressor de áudio integrado para melhor qualidade

2. **⏭️ Pulo Automático de Abertura**
   - Detecta e clica automaticamente no botão "Pular Abertura"
   - Utiliza seletor robusto baseado em atributos de dados

## 📦 Instalação

### Chrome/Edge

1. Baixe ou clone esta pasta `netfrix/`

2. Abra o navegador e acesse:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

3. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)

4. Clique em **Carregar sem compactação** (ou "Load unpacked")

5. Selecione a pasta `netfrix/`

6. Pronto! A extensão estará ativa no Netflix

## 🎮 Como Usar

1. Acesse o Netflix e inicie qualquer vídeo

2. Um painel flutuante aparecerá no canto inferior direito com os controles do normalizador

3. Clique em **Ativar** para iniciar a normalização de áudio

4. Ajuste os controles:
   - **Alvo**: Define o nível de volume desejado (0.02 a 0.3)
   - **Suavização**: Controla a velocidade de ajuste (0.01 a 0.3)

5. O pulo automático de abertura funciona automaticamente (não requer configuração)

## 🔧 Estrutura do Projeto

```
netfrix/
├── manifest.json       # Configuração da extensão
├── content.js          # Script principal com as funcionalidades
├── icons/              # Ícones da extensão
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Este arquivo
```

## 🐛 Solução de Problemas

- **Painel não aparece**: Verifique se o vídeo está sendo reproduzido
- **Áudio não normaliza**: Clique em "Ativar" no painel flutuante
- **Abertura não pula**: Verifique o console (F12) para mensagens de debug

## 📝 Notas

- A extensão só funciona em páginas do Netflix (`*.netflix.com`)
- O normalizador precisa ser ativado manualmente a cada sessão
- O pulo automático funciona assim que a página carrega

## 🔒 Permissões

A extensão requer apenas permissão de acesso ao domínio `*.netflix.com` para funcionar.
