import React from 'react';
import { Card } from './ui/Card';
import { Trophy } from 'lucide-react';
import StreakPill from './StreakPill'; // <-- IMPORT THIS

export interface LeaderboardPlayer {
  id: string;
  username: string;
  elo: number;
  avatarUrl?: string;
  currentStreak: number;
  bestStreak: number;
}

interface LeaderboardTileProps {
  players: LeaderboardPlayer[];
}

export default function LeaderboardTile({ players }: LeaderboardTileProps) {
  const topPlayers = players.slice(0, 10);
  return (
    <Card variant="surface" className="flex flex-col p-5 w-full h-full max-h-[400px] gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 border-b border-gray-700 pb-2 shrink-0">
        <Trophy size={20} className="text-accent" />
        <h3 className="text-xl font-heading font-bold text-text-default m-0">Leaderboard</h3>
      </div>

      {/* Player List */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
        {topPlayers.length === 0 && (
          <span className="text-sm text-gray-500 italic">No players ranked yet.</span>
        )}

        {topPlayers.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-hover transition-colors gap-3">
            
            {/* Left side: Rank, Avatar, Username */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              
              {/* Rank Number */}
              <span className={`text-lg font-bold w-6 shrink-0 text-center ${
                index === 0 ? 'text-yellow-400' : 
                index === 1 ? 'text-gray-300' : 
                index === 2 ? 'text-amber-600' : 
                'text-gray-500'
              }`}>
                #{index + 1}
              </span>
              
              {/* --- AVATAR W STREAK PILL --- */}
              <div className="relative shrink-0 mb-1">
                <img
                  src={player.avatarUrl || `https://ui-avatars.com/api/?name=${player.username || 'User'}&background=random`}
                  alt={player.username}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username || 'User'}&background=random`;
                  }}
                />
								<StreakPill 
										currentStreak={player.currentStreak} 
										bestStreak={player.bestStreak} 
										className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 scale-[0.65] origin-top" 
								/>
              </div>
              {/* Username */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-default truncate">
                  {player.username || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Elo Score */}
            <div className="flex flex-col items-end shrink-0 ml-2">
              <span className="text-sm font-bold text-accent">{player.elo || 1200}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Avg. Elo</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}