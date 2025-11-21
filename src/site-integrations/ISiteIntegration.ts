import { GenericVideo } from '../core/domain/entities/GenericVideo';

/**
   * Optional site-specific integration interface for custom features beyond audio....
   */
export interface ISiteIntegration {
  getName(): string;

  getSupportedHostnames(): string[];

  initialize(): void;

  onVideoDetected?(video: GenericVideo): void;

  cleanup(): void;

  isActive(): boolean;
}
