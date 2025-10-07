import { GenericDOMAdapter } from './GenericDOMAdapter';
import { GenericVideo } from '../domain/entities/GenericVideo';
import { IVideoDiscoveryObserver } from '../domain/services/IVideoDiscoveryObserver';
import { ILogger } from '../../shared/infrastructure/logger/ILogger';

/**
 * Video Discovery Service
 * Descobre vídeos HTML5 em QUALQUER site (principal + iframes)
 *
 * IMPORTANTE:
 * - Funciona em QUALQUER site automaticamente
 * - NÃO precisa de configuração específica por site
 * - Encontra qualquer elemento <video> no DOM
 * - Funciona em documento principal e iframes
 *
 * Como funciona:
 * 1. Busca inicial por vídeos existentes
 * 2. MutationObserver monitora novos vídeos adicionados ao DOM
 * 3. Polling periódico para vídeos carregados assincronamente
 * 4. Notifica observadores quando vídeo é encontrado
 *
 * Responsabilidades:
 * - Detectar elementos <video> no DOM
 * - Monitorar documento principal e iframes
 * - Notificar observadores
 * - Lidar com vídeos carregados dinamicamente
 */
export class VideoDiscoveryService {
  private observer: MutationObserver | null = null;
  private retryInterval: number | null = null;
  private observers: IVideoDiscoveryObserver[] = [];
  private discoveredVideos = new WeakSet<HTMLVideoElement>();

  constructor(
    private readonly domAdapter: GenericDOMAdapter,
    private readonly logger: ILogger
  ) {}

  /**
   * Registra um observador
   */
  public addObserver(observer: IVideoDiscoveryObserver): void {
    this.observers.push(observer);
  }

  /**
   * Remove um observador
   */
  public removeObserver(observer: IVideoDiscoveryObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Inicia a descoberta de vídeos
   */
  public startDiscovery(): void {
    // Tenta detectar imediatamente
    this.tryDiscoverVideos();

    // Setup MutationObserver para monitorar mudanças no DOM
    this.observer = new MutationObserver((mutations) => {
      // Verifica se alguma mutação adicionou elementos
      let shouldCheck = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }

      if (shouldCheck) {
        this.tryDiscoverVideos();
      }
    });

    // Monitora documento principal
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Monitora iframes que podem ser adicionados
    this.monitorIframes();

    this.logger.info('Video discovery service started');

    // Setup retry interval para descobrir vídeos que carregam assincronamente
    this.retryInterval = window.setInterval(() => {
      this.tryDiscoverVideos();
    }, 2000);

    // Para retry após 60 segundos (vídeos geralmente carregam rápido)
    setTimeout(() => {
      this.stopRetry();
    }, 60000);
  }

  /**
   * Para a descoberta
   */
  public stopDiscovery(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.stopRetry();
    this.logger.info('Video discovery service stopped');
  }

  /**
   * Tenta descobrir vídeos
   */
  private tryDiscoverVideos(): void {
    const videos = this.domAdapter.findAllVideos();

    console.log('[VideoDiscoveryService] tryDiscoverVideos - Found videos:', videos.length);

    if (videos.length === 0) {
      console.log('[VideoDiscoveryService] No videos found in DOM');
    }

    videos.forEach((video) => {
      const element = video.getElement();
      const alreadyDiscovered = this.discoveredVideos.has(element);

      console.log('[VideoDiscoveryService] Processing video:', {
        src: video.getSrc(),
        isInIframe: video.isInIframe(),
        alreadyDiscovered: alreadyDiscovered,
        isConnected: element.isConnected,
        readyState: element.readyState,
        paused: element.paused
      });

      // Só notifica se ainda não foi descoberto
      if (!alreadyDiscovered) {
        console.log('[VideoDiscoveryService] NEW VIDEO - notifying observers');
        this.discoveredVideos.add(element);
        this.notifyVideoDiscovered(video);
      } else {
        console.log('[VideoDiscoveryService] Video already discovered - skipping notification');
      }
    });
  }

  /**
   * Monitora iframes sendo adicionados ao DOM
   */
  private monitorIframes(): void {
    const iframeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLIFrameElement) {
            // Espera iframe carregar antes de buscar vídeos dentro dele
            node.addEventListener('load', () => {
              setTimeout(() => {
                this.tryDiscoverVideos();
              }, 100);
            });
          }
        });
      }
    });

    iframeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Notifica observadores sobre vídeo descoberto
   */
  private notifyVideoDiscovered(video: GenericVideo): void {
    this.logger.info(`Video discovered: ${video.isInIframe() ? 'iframe' : 'main'} context, src: ${video.getSrc()}`);

    this.observers.forEach((observer) => {
      try {
        observer.onVideoDiscovered(video);
      } catch (error) {
        this.logger.error('Error notifying observer', error);
      }
    });
  }

  /**
   * Para o retry interval
   */
  private stopRetry(): void {
    if (this.retryInterval !== null) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Força uma nova busca por vídeos
   * CRITICAL: Clears discoveredVideos WeakSet to allow re-attachment
   *
   * This is called by the health monitor when a video is lost.
   * Clearing the WeakSet ensures that previously discovered videos
   * will be treated as NEW, triggering re-notification and re-attachment.
   *
   * Without this, the cycle would be:
   * 1. Video discovered → added to WeakSet → notified ✅
   * 2. Video element replaced/removed → AudioContext cleaned up
   * 3. forceDiscovery() called → same video found BUT alreadyDiscovered=true ❌
   * 4. Video NOT re-notified → never re-attached ❌
   * 5. Loop repeats forever
   */
  public forceDiscovery(): void {
    console.log('[VideoDiscoveryService] forceDiscovery() - CLEARING discoveredVideos WeakSet to allow re-attachment');
    this.logger.info('Force discovery triggered - clearing WeakSet to allow video re-attachment');

    // CRITICAL FIX: Clear the WeakSet so all videos are treated as new
    this.discoveredVideos = new WeakSet<HTMLVideoElement>();

    this.tryDiscoverVideos();
  }
}
