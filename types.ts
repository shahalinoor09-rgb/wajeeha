
export enum GameMode {
  MATCHING = 'Matching',
  REMEMBER = 'Remember'
}

export enum Difficulty {
  EASY = '4x4',
  MEDIUM = '4x5',
  HARD = '6x6'
}

export enum GameStatus {
  IDLE = 'idle',
  PREVIEW = 'preview',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameStats {
  moves: number;
  time: number;
  matches: number;
}
