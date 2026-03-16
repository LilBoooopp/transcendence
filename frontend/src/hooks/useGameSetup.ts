import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket.service';
import { TimeControl } from '../types/timeControl';

export type GameMode = 'matchmaking' | 'bot' | 'direct';
export type BotDifficulty = 'easy' | 'medium' | 'hard';
export type GameRole = 'white' | 'black' | 'spectator' | null;

interface GameState {
  fen: string;
  pgn: string;
}

interface TimerState {
  whiteTimeMs: number;
  blackTimeMs: number;
  currentTurn: string;
  timerRunning: boolean;
}

interface UseGameSetupOptions {
  gameId?: string;
  userId: string;
  mode: GameMode;
  timeControl: TimeControl;
  botDifficulty: BotDifficulty;
}

export interface GameSetupResult {
  gameId: string | null;
  role: GameRole;
  waiting: boolean;
  initialState: GameState | null;
  initialTimer: TimerState | null;
  botDifficulty: BotDifficulty;
  error: string | null;
}

export function useGameSetup({
  gameId: initialGameId,
  userId,
  mode,
  timeControl,
  botDifficulty: initialDifficulty = 'easy',
}: UseGameSetupOptions): GameSetupResult {
  const [gameId, setGameId] = useState<string | null>(initialGameId ?? null);
  const [role, setRole] = useState<GameRole>(null);
  const [waiting, setWaiting] = useState(true);
  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [initialTimer, setInitialTimer] = useState<TimerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modeRef = useRef(mode);
  const toRef = useRef(timeControl);
  const diffRef = useRef(initialDifficulty);
  const gameIdRef = useRef(gameId);
  const hasSetupRef = useRef(false);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { toRef.current = timeControl; }, [timeControl]);
  useEffect(() => { diffRef.current = initialDifficulty; }, [initialDifficulty]);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

  useEffect(() => {
    

    if (hasSetupRef.current) return;
    hasSetupRef.current = true;

    socketService.connect(userId);

    const doSetup = () => {
      socketService.onRoleAssigned((data) => {
        setRole(data.role);
        setWaiting(false);
      });

      socketService.on('game:state', (data: { gameId: string; fen: string; pgn: string }) => {
        setInitialState({ fen: data.fen, pgn: data.pgn });
      });

      socketService.on('game:timer', (data: TimerState) => {
        setInitialTimer(prev => prev ?? data);
      });

      if (modeRef.current === 'matchmaking') {
        socketService.on('matchmaking:found', (data: { gameId: string; role: 'white' | 'black' }) => {
          setGameId(data.gameId);
          socketService.joinGame(data.gameId, toRef.current.key);
        });

        socketService.on('matchmaking:cancelled', () => {
          setError('Matchmaking cancelled');
          setWaiting(false);
        });

        socketService.joinMatchmaking(toRef.current.key);
      } else if (modeRef.current === 'bot') {
        const id = gameIdRef.current ?? `bot-${Math.random().toString(36).substr(2, 9)}`;
        setGameId(id);
        socketService.joinBotGame(id, diffRef.current, toRef.current.key);
      } else {
        if (gameIdRef.current) {
          socketService.joinGame(gameIdRef.current, toRef.current.key);
        }
      }
    };

    if (socketService.isConnected()) {
      doSetup();
    } else {
      socketService.on('connect', doSetup);
    }

    return () => {
      if (gameIdRef.current) {
        socketService.leaveGame(gameIdRef.current);
      }
      if (modeRef.current === 'matchmaking' && !gameIdRef.current) {
        socketService.cancelMatchmaking();
      }
      socketService.disconnect();
      hasSetupRef.current = false;
    };
  }, [userId]);

  return {
    gameId,
    role,
    waiting,
    initialState,
    initialTimer,
    botDifficulty: initialDifficulty,
    error,
  };
}
