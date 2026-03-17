import React from 'react';
import * as Icons from 'lucide-react';

export interface GameHistoryItem {
  id: string;
  date: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  moves: number;
  mode: 'Bullet' | 'Blitz' | 'Rapid';
  side: 'Black' | 'White';
}
interface GameHistoryListProps {
  history: GameHistoryItem[];
}

export default function GameHistoryList({ history }: GameHistoryListProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Bullet': return <Icons.Zap size={20} className="text-text-default" />;
      case 'Blitz': return <Icons.Flame size={20} className="text-text-default" />;
      case 'Rapid': return <Icons.Timer size={20} className="text-text-default" />;
      default: return <Icons.HelpCircle size={20} className="text-text-default" />;
    }
  };

  const getResultColor = (result: string) => {
    if (result === 'Win') return 'bg-green-100 text-green-700';
    if (result === 'Loss') return 'bg-red-100 text-red-700';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="w-full bg-primary rounded-xl shadow-sm overflow-hidden">
      <div className="bg-primary px-6 py-3 flex items-center justify-center border-b border-primary-hover">
        <h3 className="text-lg font-heading font-bold text-text-default m-0">Recent Matches</h3>
      </div>
      
      {/* DESKTOP Table Header (Hidden on Mobile) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-secondary text-xs font-body text-text-default uppercase tracking-wider">
        <div className="col-span-1 text-center">Mode</div>
        <div className="col-span-4 text-left">Opponent</div>
        <div className="col-span-2 text-center">Result</div>
        <div className="col-span-2 text-center">Side</div>
        <div className="col-span-1 text-center">Moves</div>
        <div className="col-span-2 text-right">Date</div>
      </div>

      <div className="divide-y divide-primary-hover">
        {history.length === 0 ? (
          <div className="p-6 text-center text-text-default">No games played yet.</div>
        ) : (
          history.map((game, index) => (
            <div 
              key={game.id} 
              className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 md:items-center transition-colors ${
                index % 2 === 0 ? 'bg-primary hover:bg-primary-hover' : 'bg-secondary hover:bg-secondary-hover'
              }`}
            >
              
              {/* --- MOBILE VIEW (Visible only on small screens) --- */}
              <div className="flex justify-between items-center w-full md:hidden mb-1">
                 <span className="font-bold text-text-default text-base truncate pr-2">
                   {game.opponent}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold w-16 text-center shrink-0 ${getResultColor(game.result)}`}>
                    {game.result}
                 </span>
              </div>
              <div className="flex justify-between items-center w-full md:hidden text-sm text-text-default/80">
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1" title={game.mode}>
                     {getModeIcon(game.mode)}
                   </div>
                   <span className="capitalize">{game.side}</span>
                   <span>• {game.moves} moves</span>
                 </div>
                 <div className="text-xs text-right whitespace-nowrap pl-2">{game.date}</div>
              </div>

              {/* --- DESKTOP VIEW (Visible only on medium+ screens) --- */}
              {/* Mode */}
              <div className="hidden md:flex col-span-1 justify-center">
                <div title={game.mode}>{getModeIcon(game.mode)}</div>
              </div>

              {/* Opponent */}
              <div className="hidden md:flex col-span-4 text-left truncate">
                <span className="font-bold text-text-default text-sm truncate">{game.opponent}</span>
              </div>

              {/* Result */}
              <div className="hidden md:flex col-span-2 justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold w-16 text-center ${getResultColor(game.result)}`}>
                  {game.result}
                </span>
              </div>

              {/* Side */}
              <div className="hidden md:flex col-span-2 justify-center items-center gap-2">
                <span className="text-sm text-text-default font-mono capitalize">{game.side}</span>
              </div>

              {/* Moves */}
              <div className="hidden md:flex col-span-1 justify-center items-center gap-2">
                <span className="text-sm text-text-default">{game.moves}</span>
              </div>

              {/* Date */}
              <div className="hidden md:block col-span-2 text-right text-sm text-text-default/70 truncate">
                {game.date}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}