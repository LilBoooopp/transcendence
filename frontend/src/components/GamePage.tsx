import React, {useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChessGame from './ChessGame';
import { socketService } from '../services/socket.service';
import { getTimeControl } from '../types/timeControl';
import type { TimerState } from './chessgui/types';

interface LocationState {
  userId?: string;
  role?: 'white' | 'black';
  tcKey?: string;
}

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state ?? {}) as LocationState;
  const [userId] = useState(() => state.userId ?? `player-${Math.random().toString(36).substr(2, 9)}`);
  const tcKey = state.tcKey ?? '600+0';
  const timeControl = getTimeControl(tcKey);

  const [role, setRole] = useState<'white' | 'black' | 'spectator' | null>(state.role ?? null);
  const [initialState, setInitialState] = useState<{ fen: string; pgn: string } | null>(null);
  const [waiting, setWaiting] = useState(!state.role);

  const hasConnected = useRef(false);

  useEffect(() => {
    if (!gameId || hasConnected.current) return;
    hasConnected.current = true;

    socketService.connect(userId);

    const doJoin = () => {
      socketService.on('game:role-assigned', (data: { gameId: string; role: 'white' | 'black' | 'specator' }) => {
        setRole(data.role);
        setWaiting(false);
      });

      socketService.on('game:state', (data: { fen: string; pgn: string }) => {
        setInitialState({ fen: data.fen, pgn: data.pgn });
      });

      socketService.on('game:timer', (data: TimerState) => {
        setInitialTimer(prev => prev ?? data);
      });

      socketService.joinGame(gameId, tcKey);

      if (state.role) {
        setWaiting(false);
      }
    };

    if (socketService.isConnected()) {
      doJoin();
    } else {
      socketService.on('connect', doJoin);
    }

    return () => {
      socketService.leaveGame(gameId);
      socketService.disconnect();
      hasConnected.current = false;
    };
  }, [gameId, userId]);

  if (!gameId) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <p className="text-text-dark/60">No game ID provided.</p>
      </div>
    );
  }

  if (waiting || role === null) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center font-body">
        <div className="bg-white rounded-2xl shadow-xl border border-accent/30 p-10 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-spin border-t-primary" />
          <h2 className="text-xl font-heading font-bold text-text-dark">
            Joining game{gameId ? ` · ${gameId.slice(0, 8)}` : ''}...
          </h2>
          <p className="text-sm text-text-dark/50">Waiting for role assignment</p>
        </div>
      </div>
    );
  }

  if (role === 'spectator') {
    return (
      <div className="min-h-screen bg-background-light">
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-center py-2 text-sm font-semibold font-body">
          Specatating {timeControl.label}
        </div>
        <ChessGame
          gameId={gameId}
          userId={userId}
          playerColor="white"
          isSpectator={true}
          initialState={initialState}
          initialTimer={initialTimer}
          incrementMs={timeControl.incrementMs}
        />
      </div>
    );
  }

  return (
    <ChessGame
      gameId={gameId}
      userId={userId}
      playerColor="white"
      isSpectator={true}
      initialState={initialState}
      initialTimer={initialTimer}
      incrementMs={timeControl.incrementMs}
    />
  );
};

export default GamePage;
