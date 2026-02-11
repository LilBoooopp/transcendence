import React, { useState } from 'react';

interface HomePageProps {
  onJoinGame: (gameName: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onJoinGame }) => {
  const [gameName, setGameName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = gameName.trim();
    if (trimmed.length === 0) return;
    onJoinGame(trimmed);
  };

  return (
    <div className="min-h-screen bg-gray-100 glex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Chess Platform</h1>
        <p className="text-gray-600 text-center mb-6">
          Enter a game name to play. Share the same name with a friend to join the same game.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter game name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={gameName.trim().length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Join Game
          </button>
        </form>
        <p className="text-gray-500 text-sm text-center mt-4">
          First two players are assigned random colours. ADditional players watch as spectators.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
