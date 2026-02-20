import React from 'react';
import * as Icons from 'lucide-react';

export interface GameHistoryItem {
  id: string;
  date: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  moves: number;
  mode: 'Bullet' | 'Blitz' | 'Rapid';
  accuracy: number;
}

interface GameHistoryListProps {
  history: GameHistoryItem[];
}

export default function GameHistoryList({ history }: GameHistoryListProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Bullet': return <Icons.Zap size={22} className="text-text-default" />;
      case 'Blitz': return <Icons.Flame size={22} className="text-text-default" />;
      case 'Rapid': return <Icons.Timer size={22} className="text-text-default" />;
      default: return <Icons.HelpCircle size={22} className="text-text-default" />;
    }
  };

  return (
    <div className="w-full bg-primary rounded-xl shadow-sm overflow-hidden">
      <div className="bg-primary px-6 py-1 flex items-center justify-center">
        <h3 className="text-lg font-heading font-bold text-text-default m-0">Recent Matches</h3>
      </div>
      
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-secondary text-xs font-body text-text-default uppercase tracking-wider">
        <div className="col-span-1 text-center">Mode</div>
        <div className="col-span-4 text-left">Opponent</div>
        <div className="col-span-2 text-center">Result</div>
        <div className="col-span-2 text-center">Accuracy</div>
        <div className="col-span-1 text-center">Moves</div>
        <div className="col-span-2 text-right">Date</div>
      </div>

      <div className="divide-y divide-primary-hover">
        {history.length === 0 ? (
          <div className="p-6 text-center text-text-default">No games played yet.</div>
        ) : (
          history.map((game, index) => (
            <div key={game.id} className={`grid grid-cols-2 md:grid-cols-12 gap-4 p-4 transition-colors items-center ${index % 2 === 0 ? 'bg-primary hover:bg-primary-hover' : 'bg-secondary hover:bg-secondary-hover'}`}>
              
              {/* Mode */}
              <div className="col-span-1 flex items-center justify-start md:justify-center gap-2">
                <span className="md:hidden text-xs font-bold text-text-default/70 uppercase">Mode:</span>
                <div title={game.mode}>{getModeIcon(game.mode)}</div>
              </div>

              {/* Players */}
              <div className="col-span-1 md:col-span-4 flex flex-col text-left">
                <span className="font-bold text-text-default text-sm"> {game.opponent}</span>
              </div>

              {/* Result */}
              <div className="col-span-1 md:col-span-2 flex justify-end md:justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold w-16 text-center ${
                  game.result === 'Win' ? 'bg-green-100 text-green-700' :
                  game.result === 'Loss' ? 'bg-red-100 text-red-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {game.result}
                </span>
              </div>

              {/* Accuracy */}
              <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center items-center gap-2">
                <span className="md:hidden text-xs font-bold text-text-default/70 uppercase">Acc:</span>
                <span className="text-sm text-text-default font-mono">{game.accuracy}%</span>
              </div>

              {/* Moves */}
              <div className="col-span-1 flex justify-end md:justify-center items-center gap-2">
                <span className="md:hidden text-xs font-bold text-text-default/70 uppercase">Moves:</span>
                <span className="text-sm text-text-default">{game.moves}</span>
              </div>

              {/* Date */}
              <div className="col-span-2 text-center md:text-right text-sm text-text-default/70">
                {game.date}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}