import React from 'react';
import ChessGame from './components/ChessGame';

function App() {
  const params = new URLSearchParams(window.location.search);

  const gameId = params.get('gameId') || 'test-game';
  const userId = params.get('userId') || 'player1';
  const playerColor = (params.get('color') as 'white' | 'black') || 'white';

  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">
        Chess Platform - Player: {userId} ({playerColor})
      </h1>
      <ChessGame
        gameId={gameId}
        userId={userId}
        playerColor={playerColor}
      />
    </div>
  );
}

export default App;
