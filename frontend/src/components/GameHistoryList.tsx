import React from 'react';

export interface GameHistoryItem {
  id: string;
  date: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  moves: number;
}

interface GameHistoryListProps {
  history: GameHistoryItem[];
}

export default function GameHistoryList({ history }: GameHistoryListProps) {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-heading font-bold text-gray-800">Recent Matches</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {history.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No games played yet.</div>
        ) : (
          history.map((game) => (
            <div key={game.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">vs {game.opponent}</span>
                <span className="text-sm text-gray-500">{game.date}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:inline">{game.moves} moves</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  game.result === 'Win' ? 'bg-green-100 text-green-700' :
                  game.result === 'Loss' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {game.result}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}