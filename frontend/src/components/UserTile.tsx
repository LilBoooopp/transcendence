import React from 'react';
import { Card } from './ui/Card';
import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import StreakPill from './StreakPill';

interface UserTileProps {
  username: string;
  avatarUrl?: string;
  MemberSince?: string;
  TotalGames?: number;
  AvgScore?: number;
  currentStreak?: number;
  bestStreak?: number;   
  onClick?: () => void;
}

export default function UserTile({ 
  username, 
  avatarUrl, 
  MemberSince, 
  TotalGames, 
  AvgScore, 
  currentStreak = 0, 
  bestStreak = 0,    
  onClick 
}: UserTileProps) {
  const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";

  let avatarSrc = placeholderImage;

  if (typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    const filename = avatarUrl.trim().replace(/^\/?(api\/)?uploads\//, '');
    avatarSrc = `/api/uploads/${filename}`;
  }


  const displayInfoParts: string[] = [];
  if (MemberSince) displayInfoParts.push(`Member since ${MemberSince}`);
  if (TotalGames !== undefined && TotalGames !== null) displayInfoParts.push(`${TotalGames} Games Played`);
  if (AvgScore !== undefined && AvgScore !== null) displayInfoParts.push(`Avg. Score: ${AvgScore}`);

  return (
    <Card 
      variant="surface"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center text-center p-8 gap-4 w-full h-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Link
        to="/user"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-accent hover:bg-primary/30 transition-all z-10"
        title="Edit Profile"
      >
        <Pencil size={20} />
      </Link>

      {/* Avatar Container */}
      <div className="relative flex-shrink-0 mb-2">
        <img
          //src={avatarSrc}
		  src={`/api/uploads/${avatarUrl}`}
          alt={`${username}'s avatar`}
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
          className="w-28 h-28 rounded-full object-cover shadow-sm border-4 border-accent"
        />
        
        {/* Achievements Pill - Cleaned up and passed positioning via className */}
        <StreakPill 
          currentStreak={currentStreak} 
          bestStreak={bestStreak} 
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10"
        />
      </div>

      <div className="flex flex-col items-center w-full overflow-hidden gap-1">
        <h3 className="text-3xl font-heading font-bold text-text-default m-0 truncate w-full">
          {username}
        </h3>

        {displayInfoParts.length > 0 && (
          <div className="text-body text-gray-400 mt-2 flex flex-col gap-1 text-sm">
            {displayInfoParts.map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}