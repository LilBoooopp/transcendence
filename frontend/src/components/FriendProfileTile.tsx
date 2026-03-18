import React from 'react';
import { Card } from './ui/Card';
import StreakPill from './StreakPill';

export interface FriendProfileTileProps {
  username: string;
  bio?: string;
  avatarUrl?: string;
  elo?: number;
  currentStreak?: number;
  bestStreak?: number;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2 mt-3 md:mt-2 w-full">
      <span className="text-sm text-text-default md:w-24 md:text-left text-center shrink-0">
        {label}:
      </span>
      <span className="text-sm font-bold text-text-default text-center md:text-left break-words w-full md:flex-grow">
        {value || 'N/A'}
      </span>
    </div>
  );
}

export default function FriendProfileTile({
  username,
  bio,
  avatarUrl,
  elo,
  currentStreak,
  bestStreak
}: FriendProfileTileProps) {
  
  const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";
  const avatarSrc =
    avatarUrl && avatarUrl.trim() !== ''
      ? `/api/uploads/${avatarUrl.trim().replace(/^\/?(api\/)?uploads\//, '')}`
      : placeholderImage;

  return (
    <Card variant="surface" className="flex flex-col md:flex-row items-center md:items-start p-6 gap-6 w-full cursor-default relative">
      {/* Profile Picture & Streak */}
      <div className="flex-shrink-0 relative flex flex-col items-center">
        <img
          src={avatarSrc}
          alt={`${username}'s avatar`}
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
          className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-accent mb-4"
        />
        <StreakPill currentStreak={currentStreak} bestStreak={bestStreak} />
      </div>

      {/* Read-Only Details */}
      <div className="flex flex-col items-center md:items-start flex-grow w-full overflow-hidden">
        <h3 className="text-2xl font-heading font-bold text-text-default mb-2 text-center md:text-left w-full truncate">
          {username}'s Profile
        </h3>
        <ReadOnlyField label="Username" value={username} />
        <ReadOnlyField label="Average Elo" value={elo !== undefined ? elo.toString() : 'N/A'} />
        <ReadOnlyField label="Bio" value={bio || 'No bio provided.'} />
      </div>
    </Card>
  );
}