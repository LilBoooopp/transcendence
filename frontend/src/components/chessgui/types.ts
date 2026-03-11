// Coordinate & Move type

export interface Coord {
  rank: number;
  file: number;
}

export interface Premove {
  from: Coord;
  to: Coord;
}

export interface Arrow {
  start: Coord;
  end: Coord;
}

// Timer

export interface TimerState {
  whiteTimeMs: number;
  blackTimeMs: number;
  currentTurn: string; // 'w' | 'b'
  timerRunning: boolean;
}

// promote

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

// Component props

export interface ChessGameProps {
  gameId: string;
  userId: string;
  playerColor: 'white' | 'black';
  isSpectator?: boolean;
  initialState?: { fen: string; pgn: string } | null;
  initialTimer?: TimerState | null;
  incrementMs?: number;
}
