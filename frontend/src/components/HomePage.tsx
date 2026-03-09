import React, { useState } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'human' | 'bot';

interface HomePageProps {
  onJoinGame: (gameName: string) => void;
  onJoinBotGame: (difficulty: Difficulty) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onJoinGame, onJoinBotGame }) => {
  const [mode, setMode] = useState<Mode>('human');
  const [gameName, setGameName] = useState('');

  const handleMultiplayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = gameName.trim();
    if (trimmed.length === 0) return;
    onJoinGame(trimmed);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Chess Platform</h1>

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-6">
          <button
            onClick={() => setMode('human')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              mode === 'human'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            vs Human
          </button>
          <button
            onClick={() => setMode('bot')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              mode === 'bot'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            vs Bot
          </button>
        </div>

        {mode === 'human' ? (
          <>
            <p className="text-gray-600 text-center mb-4">
              Enter a game name and share it with a friend to player together.
            </p>
            <form onSubmit={handleMultiplayerSubmit}>
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
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-color"
              >
                Join Game
              </button>
              <p className="text-gray-500 text-sm text-center mt-4">
                First town players get random colours. Additional players spectate.
              </p>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-center mb-6">
              Choose a difficulty to play against Stockfish.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { diff: 'easy', label: 'Easy', cls: 'bg-green-50 border-green-400 text-green-800 hover:bg-green-100' },
                { diff: 'medium', label: 'Medium', cls: 'bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100' },
                { diff: 'hard', label: 'Hard', cls: 'bg-red-50 border-red-400 text-red-800 hover:bg-red-100' },
                ].map(({ diff, label, cls }) => (
                <button
                  key={diff}
                  onClick={() => onJoinBotGame(diff as Difficulty)}
                  className={`w-full py-3 rounded-lg text-lg font-semibold border-2 capitalize transition-all hover:scale-[1.01] active:scale-[0.99] ${cls}`}
                >
                  {label}
                </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
