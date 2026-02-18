import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // 1. Import Router

// Existing Imports
import ChessGame from './components/ChessGame';
import HomePage from './components/HomePage';
import { socketService } from './services/socket.service';

// Wireframe Imports
import WireframeLayout from './wireframe/WireframeLayout';
import WireframeDashboard from './wireframe/WireframeDashboard';

// --- TYPE DEFINITIONS (From your original file) ---
type GameRole = 'white' | 'black' | 'spectator' | null;
interface GameState {
  fen: string;
  pgn: string;
}

// --- ORIGINAL APP LOGIC (Renamed) ---
// I just wrapped your entire old App component in this function
function CurrentGameLogic() {
  const [gameId, setGameId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return hash.length > 0 ? hash : null;
  });
  const [userId] = useState<string>(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  const [role, setRole] = useState<GameRole>(null);
  const [waiting, setWaiting] = useState(() => {
    const hash = window.location.hash.slice(1);
    return (hash.length > 0);
  });
  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [initialTimer, setInitialTimer] = useState<{
    whiteTimeMs: number;
    blackTimeMs: number;
    currentTurn: string;
    timerRunning: boolean;
  } | null>(null);
  const hasConnected = useRef(false);

  const handleJoinGame = (gameName: string) =>  {
    window.location.hash = gameName;
    setWaiting(true);
    setGameId(gameName);
  };

  useEffect(() => {
    if (!gameId || hasConnected.current) return;
    hasConnected.current = true;

    socketService.connect(userId);

    socketService.on('connect', () => {
      console.log('Socket connected, now joining game:', gameId);

      socketService.onRoleAssigned((data: { gameId: string; role: 'white' | 'black' | 'spectator' }) => {
        setRole(data.role);
        setWaiting(false);
      });

      socketService.on('game:state', (data: { gameId: string; fen: string; pgn: string; }) => {
        setInitialState({ fen: data.fen, pgn: data.pgn });
      });

      socketService.on('game:timer', (data: { whiteTimeMs: number; blackTimeMs: number; currentTurn: string; timerRunning: boolean }) => {
        setInitialTimer(data);
      });

      socketService.joinGame(gameId);
    });

    return () => {
      socketService.leaveGame(gameId);
      socketService.disconnect();
      hasConnected.current = false;
    };
  }, [gameId, userId]);

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
          initialState={initialState}
          initialTimer={initialTimer}
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
        initialState={initialState}
        initialTimer={initialTimer}
      />
    </div>
  );
}

// --- NEW ROUTER APP ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. The New Wireframe URL */}
        <Route path="/wireframe" element={
          <WireframeLayout>
            <WireframeDashboard />
          </WireframeLayout>
        } />

        {/* 2. The Default URL (Your existing game logic) */}
        <Route path="*" element={<CurrentGameLogic />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;