import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * CORS Bypass Service
 * Adiciona atributo crossOrigin aos vídeos ANTES deles carregarem
 * para evitar erros CORS no createMediaElementSource
 *
 * Responsabilidades:
 * - Interceptar criação de elementos de vídeo
 * - Adicionar crossorigin="anonymous" antes do carregamento
 * - Monitorar vídeos existentes e novos
 */
export class CORSBypassService {
  private observer: MutationObserver | null = null;
  private processedVideos = new WeakSet<HTMLVideoElement>();

  constructor(private readonly logger: ILogger) {}

  /**
   * Inicia o monitoramento de vídeos
   */
  public start(): void {
    // Processa vídeos existentes
    this.processExistingVideos();

    // Monitora novos vídeos sendo adicionados
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.processNode(node);
          });
        } else if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target instanceof HTMLVideoElement && mutation.attributeName === 'src') {
            this.processVideo(target);
          }
        }
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    this.logger.info('CORS bypass service started');
  }

  /**
   * Para o monitoramento
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.logger.info('CORS bypass service stopped');
  }

  /**
   * Processa vídeos já existentes no DOM
   */
  private processExistingVideos(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement) {
        this.processVideo(video);
      }
    });

    // Também processa vídeos em iframes same-origin
    this.processIframeVideos(document);
  }

  /**
   * Processa um nó e seus descendentes
   */
  private processNode(node: Node): void {
    if (node instanceof HTMLVideoElement) {
      this.processVideo(node);
    } else if (node instanceof HTMLElement) {
      const videos = node.querySelectorAll('video');
      videos.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          this.processVideo(video);
        }
      });
    } else if (node instanceof HTMLIFrameElement) {
      this.processIframeVideos(node);
    }
  }

  /**
   * Processa vídeos dentro de iframes (same-origin apenas)
   */
  private processIframeVideos(context: Document | HTMLIFrameElement): void {
    try {
      let iframeDocument: Document | null = null;

      if (context instanceof HTMLIFrameElement) {
        try {
          iframeDocument = context.contentDocument;
        } catch {
          // Cross-origin iframe, não pode acessar
          return;
        }
      } else {
        const iframes = context.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          this.processIframeVideos(iframe);
        });
        return;
      }

      if (!iframeDocument) return;

      const videos = iframeDocument.querySelectorAll('video');
      videos.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          this.processVideo(video);
        }
      });
    } catch (error) {
      // Ignora erros de acesso a iframes cross-origin
    }
  }

  /**
   * Processa um elemento de vídeo individual
   */
  private processVideo(video: HTMLVideoElement): void {
    // Evita processar o mesmo vídeo múltiplas vezes
    if (this.processedVideos.has(video)) {
      return;
    }

    try {
      // Se o vídeo já tem crossOrigin configurado, não modifica
      if (video.crossOrigin) {
        this.processedVideos.add(video);
        return;
      }

      // Se o vídeo já começou a carregar (readyState > 0), pode ser tarde demais
      // Mas ainda tentamos para casos onde funciona
      const hadSrc = video.src || video.currentSrc;

      // Define crossOrigin ANTES de qualquer src ser setado (ideal)
      video.crossOrigin = 'anonymous';
      this.processedVideos.add(video);

      if (hadSrc) {
        this.logger.debug('Added crossOrigin to video (already had src, may need reload)');
      } else {
        this.logger.debug('Added crossOrigin to video (before src set)');
      }

      // Se o vídeo já tinha src e não está carregado ainda, força reload
      // Isso funciona para alguns sites
      if (hadSrc && video.readyState === 0 && video.networkState <= 2) {
        const currentSrc = video.src;
        video.removeAttribute('src');
        video.load();
        video.src = currentSrc;
        this.logger.debug('Reloaded video with crossOrigin');
      }
    } catch (error) {
      this.logger.debug('Error processing video for CORS bypass', error);
    }
  }

  /**
   * Tenta aplicar CORS bypass a um vídeo específico
   * Útil para chamadas manuais quando um vídeo é detectado
   */
  public applyCORSBypass(video: HTMLVideoElement): void {
    this.processVideo(video);
  }
}
