import React from 'react';
import ChessGame from './components/ChessGame';

function App() {
  const gameId = 'test-game';
  const userId = 'user';
  const playerColor = 'white';
  return (
    <div className="min-h-screen bg-gray-100">
      <ChessGame
        gameId={gameId}
        userId={userId}
        playerColor={playerColor}
      />
    </div>
  );
}

export default App;
