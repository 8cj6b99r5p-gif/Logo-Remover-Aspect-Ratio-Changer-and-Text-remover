export enum ProcessingStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  READY_TO_CLEAN = 'READY_TO_CLEAN',
  CLEANING = 'CLEANING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ExtractedImage {
  id: string;
  originalUrl: string;
  cleanedUrl?: string;
  status: 'pending' | 'cleaning' | 'done' | 'failed';
  pageIndex: number;
}

export interface GeminiConfig {
  apiKey: string;
}

export enum AppMode {
  CLEAN = 'CLEAN',
  CONVERT = 'CONVERT',
  REMOVE_TEXT = 'REMOVE_TEXT'
}