export interface ParticleProp {
  position: [number, number, number];
  color: string;
  size: number;
}

export interface GeminiResponse {
  greeting: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GreetingCardData {
  id: string;
  name: string;
  message: string;
  image: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
}