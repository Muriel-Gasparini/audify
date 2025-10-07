import { GenericVideo } from '../domain/entities/GenericVideo';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Generic DOM Adapter
 * Busca vídeos em QUALQUER site (documento principal + iframes)
 *
 * Responsabilidades:
 * - Encontrar todos os elementos de vídeo HTML5
 * - Buscar no documento principal
 * - Buscar em iframes same-origin
 * - Encapsular lógica de acesso ao DOM
 */
export class GenericDOMAdapter {
  private static readonly VIDEO_SELECTOR = 'video';

  constructor(private readonly logger: ILogger) {}

  /**
   * Encontra todos os vídeos no documento principal
   */
  public findVideosInMainDocument(): GenericVideo[] {
    const videos: GenericVideo[] = [];
    const videoElements = document.querySelectorAll(GenericDOMAdapter.VIDEO_SELECTOR);

    videoElements.forEach((element) => {
      if (element instanceof HTMLVideoElement) {
        const video = new GenericVideo(element, 'main');
        if (video.isReady()) {
          videos.push(video);
        }
      }
    });

    return videos;
  }

  /**
   * Encontra todos os vídeos em iframes same-origin
   */
  public findVideosInIframes(): GenericVideo[] {
    const videos: GenericVideo[] = [];
    const iframes = document.querySelectorAll('iframe');

    iframes.forEach((iframe) => {
      try {
        const iframeVideos = this.extractVideosFromIframe(iframe);
        videos.push(...iframeVideos);
      } catch (error) {
        // Cross-origin iframe - não pode acessar
        // Isso é esperado e normal
      }
    });

    return videos;
  }

  /**
   * Encontra TODOS os vídeos (principal + iframes)
   */
  public findAllVideos(): GenericVideo[] {
    const mainVideos = this.findVideosInMainDocument();
    const iframeVideos = this.findVideosInIframes();

    const allVideos = [...mainVideos, ...iframeVideos];

    if (allVideos.length > 0) {
      this.logger.debug(`Found ${allVideos.length} video(s): ${mainVideos.length} in main, ${iframeVideos.length} in iframes`);
    }

    return allVideos;
  }

  /**
   * Encontra o primeiro vídeo pronto (prioriza principal, depois iframes)
   */
  public findFirstReadyVideo(): GenericVideo | null {
    // Tenta no documento principal primeiro
    const mainVideos = this.findVideosInMainDocument();
    if (mainVideos.length > 0) {
      return mainVideos[0];
    }

    // Tenta em iframes
    const iframeVideos = this.findVideosInIframes();
    if (iframeVideos.length > 0) {
      return iframeVideos[0];
    }

    return null;
  }

  /**
   * Extrai vídeos de um iframe específico
   */
  private extractVideosFromIframe(iframe: HTMLIFrameElement): GenericVideo[] {
    const videos: GenericVideo[] = [];

    try {
      // Tenta acessar contentDocument (só funciona para same-origin)
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDocument) {
        return videos;
      }

      const videoElements = iframeDocument.querySelectorAll(GenericDOMAdapter.VIDEO_SELECTOR);

      videoElements.forEach((element) => {
        if (element instanceof HTMLVideoElement) {
          const origin = this.getIframeOrigin(iframe);
          const video = new GenericVideo(element, 'iframe', origin);

          if (video.isReady()) {
            videos.push(video);
          }
        }
      });
    } catch (error) {
      // Cross-origin iframe - não pode acessar
      // Silenciosamente ignora
    }

    return videos;
  }

  /**
   * Obtém a origem de um iframe
   */
  private getIframeOrigin(iframe: HTMLIFrameElement): string {
    try {
      return iframe.contentWindow?.location.origin || iframe.src || 'unknown';
    } catch {
      return iframe.src || 'unknown';
    }
  }

  /**
   * Verifica se um elemento de vídeo existe no DOM
   */
  public videoExistsInDOM(videoElement: HTMLVideoElement): boolean {
    return document.body.contains(videoElement) || this.videoExistsInIframes(videoElement);
  }

  /**
   * Verifica se um vídeo existe em algum iframe
   */
  private videoExistsInIframes(videoElement: HTMLVideoElement): boolean {
    const iframes = document.querySelectorAll('iframe');

    for (const iframe of iframes) {
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument && iframeDocument.body.contains(videoElement)) {
          return true;
        }
      } catch {
        // Ignora cross-origin
      }
    }

    return false;
  }
}
