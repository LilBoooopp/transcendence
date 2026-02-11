import React, { useState, useEffect, useCallback } from 'react';
import ChessGame from './components/ChessGame';
import HomePage from './components/HomePage';
import { socketService } from './services/socket.service';

type GameRole = 'white' | 'black' | 'spectator' | null;

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [userId] = useState<string>(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  const [role, setRole] = useState<GameRole>(null);
  const [waiting, setWaiting] = useState(false);

  const handleJoinGame = useCallback((gameName: string) =>  {
    setWaiting(true);
    setGameId(gameName);

    socketService.connect(userId);
    socketService.onRoleAssigned((data) => {
      console.log('Role assigned:', data);
      setRole(data.role);
      setWaiting(false);
    });

    socketService.joinGame(gameName);
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameId) {
        socketService.leaveGame(gameId);
      }
      socketService.disconnect();
    };
  }, [gameId]);

  // State: homepage (no gameid yet)
  if (!gameId) {
    return <HomePage onJoinGame={handleJoinGame} />;
  }

  if (waiting || role === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Joining game: {gameId}</h2>
          <p className="text-gray-600">Waiting for role assignment...</p>
        </div>
      </div>
    );
  }

  if (role === 'spectator') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-center py-2 font-semibold">
          You are spectating this game - you cannot move pieces
        </div>
        <h1 className="text-3xl font-bold text-center py-4">
          Chess Platform - Spectator (Game: {gameId})
        </h1>
        <ChessGame
          gameId={gameId}
          userId={userId}
          playerColor="white"
          isSpectator={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">
        Chess Platform - Player: {userId} ({role})
      </h1>
      <ChessGame
        gameId={gameId}
        userId={userId}
        playerColor={role}
        isSpectator={false}
      />
    </div>
  );
}

export default App;
