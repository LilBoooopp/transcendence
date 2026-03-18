import React from 'react';
import Button from '../../components/Button';

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

  const compactBtnClass = "flex-1 !py-1.5 !px-2 text-xs";

  if (drawOffered) {
    return (
      <>
        <style>{`
          @keyframes border-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-body text-center text-text-dark/70">Draw offered</p>
          <div className="relative">
            <div 
              className="absolute inset-0 z-0 pointer-events-none rounded-[10px] overflow-hidden"
              style={{
                padding: '2px', 
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            >
              <div 
                className="absolute inset-y-0 w-[150%] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-80" 
                style={{ animation: 'border-sweep 2.5s linear infinite' }}
              />
            </div>
            
            <div className="relative z-10 flex gap-2 w-full h-full p-[2px]">
              <Button 
                variant="secondary"
                onClick={() => onDrawResponse(true)}
                className={compactBtnClass}
              >
                ✓ Accept
              </Button>
              <Button 
                variant="tertiary"
                onClick={() => onDrawResponse(false)}
                className={compactBtnClass}
              >
                ✕ Decline
              </Button>
            </div>
            
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-body text-center opacity-0 pointer-events-none select-none" aria-hidden="true">
        Placeholder
      </p>
      <div className="flex gap-2 w-full p-[2px]">
        <Button
          variant="secondary"
          onClick={onDrawOffer}
          disabled={drawOfferSent}
          className={`${compactBtnClass} ${drawOfferSent ? '!bg-secondary-hover cursor-not-allowed' : ''}`}
          title={drawOfferSent ? 'Draw offer sent, waiting...' : 'Offer a draw'}
        >
          {drawOfferSent ? '½ Waiting...' : '½ Draw'}
        </Button>
        <Button
          variant="tertiary"
          onClick={onResign}
          className={compactBtnClass}
          title="Resign the game"
        >
          ⚑ Resign
        </Button>
      </div>
    </div>
  );
};