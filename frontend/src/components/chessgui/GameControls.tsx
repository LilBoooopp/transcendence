import React from 'react';

interface GameControlsProps {
  isSpectator: boolean;
  gameOver: boolean;
  drawOfferSent: boolean;
  drawOffered: boolean;
  onResign: () => void;
  onDrawOffer: () => void;
  onDrawResponse: (accepted: boolean) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ 
  isSpectator, gameOver, drawOfferSent, drawOffered, onResign, onDrawOffer, onDrawResponse 
}) => {
  if (isSpectator || gameOver) return null;

  if (drawOffered) {
    return (
      <div className="flex flex-col gap-1.5 pt-2 border-t border-accent/30">
        <p className="text-xs font-body text-center text-text-dark/70">Draw offered</p>
        <div className="flex gap-2">
          <button
            onClick={() => onDrawResponse(true)}
            className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-secondary/20 hover:bg-secondary/40 text-secondary transition-colors"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => onDrawResponse(false)}
            className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          >
            ✕ Decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onDrawOffer}
        disabled={drawOfferSent}
        className={[
          'flex-1 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors',
          drawOfferSent ? 'bg-secondary-hover text-text-default cursor-not-allowed' : 'bg-secondary hover:bg-secondary-hover text-text-default',
        ].join(' ')}
        title={drawOfferSent ? 'Draw offer sent, waiting...' : 'Offer a draw'}
      >
        {drawOfferSent ? '½ Waiting...' : '½ Draw'}
      </button>
      <button
        onClick={onResign}
        className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-tertiary hover:bg-tertiary-hover text-text-default transition-colors"
        title="Resign the game"
      >
        ⚑ Resign
      </button>
    </div>
  );
};