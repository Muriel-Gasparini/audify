// ============================================================================
// Configuration Types
// ============================================================================

export interface NormalizerConfig {
  targetLevel: number;
  smoothing: number;
  maxGain: number;
  isActive: boolean;
}

export interface AudioState {
  gain: number;
  volume: number;
  isActive: boolean;
}

// ============================================================================
// Message Types (Communication between popup and content script)
// ============================================================================

export type MessageType =
  | 'GET_CONFIG'
  | 'SET_CONFIG'
  | 'GET_STATE'
  | 'TOGGLE_NORMALIZER';

export interface Message<T = Record<string, never>> {
  type: MessageType;
  data?: T;
}

export interface GetConfigResponse {
  config: NormalizerConfig;
}

export type SetConfigData = Partial<NormalizerConfig>;

export interface GetStateResponse {
  state: AudioState;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CONFIG: 'normalizerConfig',
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_CONFIG: NormalizerConfig = {
  targetLevel: 0.1,
  smoothing: 0.05,
  maxGain: 8.0,
  isActive: false,
};
