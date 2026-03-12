import React from 'react';

interface GamePlayerTileProps {
  username: string;
  color: 'white' | 'black';
  isActive?: boolean;
  isBottom?: boolean;
}

const GamePlayerTile: React.FC<GamePlayerTileProps> = ({ 
  username, 
  color, 
  isActive,
  isBottom 
}) => {
  return (
    <div 
      className={[
        'flex items-center justify-between p-2 rounded-xl transition-all duration-300 w-full border',
        isActive 
          ? 'bg-primary/10 border-primary/30 shadow-sm' 
          : 'bg-white border-accent/20 shadow-sm',
        isBottom ? 'mt-2' : 'mb-2'
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        {/* Avatar/Piece Placeholder */}
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-2xl shadow-inner text-text-dark">
          {color === 'white' ? '♔' : '♚'}
        </div>
        
        {/* User Info */}
        <div className="flex flex-col">
          <span className="font-heading font-bold text-text-dark leading-tight tracking-wide">
            {username}
          </span>
          {/* You can easily swap this out for Elo or Status later */}
          <span className="text-xs font-body text-text-dark/50 font-medium uppercase tracking-wider">
            {color}
          </span>
        </div>
      </div>

      {/* Optional: Add a "thinking" indicator when it's their turn */}
      {isActive && (
        <div className="pr-3 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};

export default GamePlayerTile;