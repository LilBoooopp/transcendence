import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChessGame from './chessgui';
import type { ChessGameProps } from './chessgui';
import { socketService } from '../services/socket.service';

interface GamePageProps {
  userId: string;
}

const Game: React.FC<GamePageProps> = ({ userId }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [initialState, setInitialState] = useState<ChessGameProps['initialState']>(null);
  const [initialTimer, setInitialTimer] = useState<ChessGameProps['initialTimer']>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    socketService.connect(userId);
    socketService.joinGame(gameId);

    const unsubRole = socketService.on(
      'game:player-joined',
      (data: { color: 'white' | 'black' | 'spectator'; fen?: string; pgn?: string }) => {
        if (data.color === 'spectator') {
          setIsSpectator(true);
          setPlayerColor('white');
        } else {
          setPlayerColor(data.color);
        }
        if (data.fen || data.pgn) {
          setInitialState({ fen: data.fen ?? '', pgn: data.pgn ?? '' });
        }
        setIsReady(true);
      }
    );

    const unsubTimer = socketService.on(
      'game:timer',
      (data: ChessGameProps['initialTimer']) => {
        if (!isReady) setInitialTimer(data);
      }
    );

    return () => {
      unsubRole?.();
      unsubTimer?.();
      socketService.leaveGame(gameId!);
    };
  }, [gameId, userId]);

  if (!gameId) return (<div className="p-8 text-center text-stone-500">No game ID provided.</div>);

  if (!isReady || !playerColor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <p className="text-stone-400 text-sm animate-pulse">Connecting to game...</p>
      </div>
    );
  }

  return (
    <ChessGame
      gameId={gameId}
      userId={userId}
      playerColor={playerColor}
      isSpectator={isSpectator}
      initialState={initialState}
      initialTimer={initialTimer}
    />
  );
};

export default Game;
