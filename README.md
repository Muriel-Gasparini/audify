# Netflix Audio Normalizer & Auto Skip

Extensão para Chrome/Edge que adiciona normalização de áudio e pulo automático de abertura no Netflix.

## ✨ Funcionalidades

1. **🎚️ Normalizador de Áudio**
   - Normaliza automaticamente o volume do áudio para evitar picos muito altos
   - Interface de controle via popup da extensão
   - Compressor de áudio integrado para melhor qualidade
   - Detecção automática de vídeos (funciona mesmo se você já estiver assistindo)

2. **⏭️ Pulo Automático de Abertura**
   - Detecta e clica automaticamente no botão "Pular Abertura"
   - Funciona automaticamente sem configuração

## 🛠️ Desenvolvimento

### Requisitos

- Node.js 18+
- npm

### Instalação das Dependências

```bash
npm install
```

### Build

```bash
# Build único
npm run build

# Build com watch mode
npm run watch
```

### Estrutura do Projeto

```
netfrix/
├── src/
│   ├── content.ts      # Content script (normalizer + auto-skip)
│   ├── popup.ts        # Popup UI logic
│   ├── types.ts        # TypeScript interfaces
│   └── storage.ts      # Chrome storage helpers
├── public/
│   ├── popup.html      # Popup UI
│   └── icons/          # Extension icons
├── dist/               # Build output
├── manifest.json       # Extension manifest
├── build.js            # esbuild script
├── tsconfig.json       # TypeScript config
└── package.json
```

## 📦 Instalação da Extensão

1. Clone o repositório e rode o build:
   ```bash
   npm install
   npm run build
   ```

2. Abra o navegador e acesse:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

3. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)

4. Clique em **Carregar sem compactação** (ou "Load unpacked")

5. Selecione a pasta raiz do projeto (`netfrix/`)

6. Pronto! A extensão estará ativa no Netflix

## 🎮 Como Usar

1. Acesse o Netflix e inicie qualquer vídeo

2. Clique no ícone da extensão na barra de ferramentas

3. Use o popup para:
   - **Ativar/Desativar** o normalizador
   - Ajustar **Nível Alvo** (0.02 a 0.3)
   - Ajustar **Suavização** (0.01 a 0.3)
   - Ver o **Gain** atual em tempo real

4. O pulo automático de abertura funciona automaticamente

## 🔧 Tecnologias

- **TypeScript** (strict mode, sem `any` ou `unknown`)
- **esbuild** (bundler rápido)
- **Chrome Extension Manifest V3**
- **Web Audio API**

## 📝 Notas Técnicas

- Tipagem forte em todo o código
- Detecção dinâmica de elementos `<video>` via MutationObserver
- Comunicação tipada entre popup e content script
- Configurações persistidas via `chrome.storage.sync`
- Proteção contra picos com limite de ganho máximo (8x)
- Reset automático de ganho ao pular vídeo

## 🔒 Permissões

- `storage`: Para salvar configurações
- `*://*.netflix.com/*`: Acesso ao Netflix

## 🐛 Debug

Abra o console do navegador (F12) na página do Netflix para ver logs:
- `✅ Auto-skip ativado`
- `✅ Video watcher ativado`
- `🎧 Conectando ao elemento de vídeo...`
- `🔘 Botão "Pular Abertura" encontrado, clicando...`
