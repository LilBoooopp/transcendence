import React from 'react';

interface GamePlayerTileProps {
  username: string;
  avatarUrl?: string;
  avgRating?: number;
  color: 'white' | 'black'
  isActive?: boolean;
}

const GamePlayerTile: React.FC<GamePlayerTileProps> = ({
  username,
  avatarUrl,
  color,
  isActive
}) => {
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${username}&background=random`;

  const gradientClass = color === 'white'
    ? 'bg-gradient-to-r from-primary to-white'
    : 'bg-gradient-to-r from-primary to-black';

  return (
    <div
      className={[
        'flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all duration-300 w-full h-full',
        gradientClass,
      ].join(' ')}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <img
          src={avatarUrl || fallbackAvatar}
          alt={`${username}'s avatar`}
          className="w-10 h-10 shrink-0 rounded-full object-cover shadow-inner border border-accent"
        />
        <div className="flex flex-col truncate">
          <span className="font-heading font-bold text-text-default text-sm sm:text-base leading-tight tracking-wide truncate">
            {username}
          </span>
          <span className="text-[10px] sm:text-xs font-body text-text-default uppercase tracking-widest mt-0.5">
            {color}
          </span>
        </div>
      </div>

      {isActive && (
        <div className="pr-2 flex gap-1 shrink-0">
          {/* 2. Inject the variable using ${} notation */}
          <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-primary`} style={{ animationDelay: '0ms' }} />
          <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-primary`} style={{ animationDelay: '150ms' }} />
          <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-primary`} style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};

export default GamePlayerTile;
