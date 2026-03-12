// src/components/chessgui/ChessGame.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
import GameEndPopup from './GameEndPopup';
import GamePlayerTile from './GamePlayerTile'; 
import { Card } from '../ui/Card'; 
import { classicTheme } from './themes';
import { useChessGame } from './hooks/useChessGame';
import { ChessGameProps } from './types';

// Import our newly extracted UI components
import { Clock } from './Clock';
import { StatusBadge } from './StatusBadge';
import { MoveHistory } from './MoveHistory';
import { GameControls } from './GameControls';

const BOARD_SIZE = 'min(calc(100vw - 2rem), 80vh, 600px)';

const ChessGame: React.FC<ChessGameProps> = (props) => {
  const { playerColor, isSpectator = false } = props;
  const navigate = useNavigate();

  const {
    board, moveHistory, highlighted, lastMove, premoves,
    gameStatus, gameOver, promotionMove, timer,
    onTileClick, onDrop, onDragStart, completePromotion,
    drawOffered, drawOfferSent,
    handleResign, handleDrawOffer, handleDrawResponse,
  } = useChessGame(props);

  const { whiteTimeMs, blackTimeMs, currentTurn, timerRunning } = timer;

  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';
  const topLabel = topColor === 'w' ? 'White' : 'Black';
  const bottomLabel = bottomColor === 'w' ? 'White' : 'Black';
  const topTimeMs = topColor === 'w' ? whiteTimeMs : blackTimeMs;
  const bottomTimeMs = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

  return (
   <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-4 w-full max-w-7xl mx-auto font-body relative">

      {/* Left Column: Player Top, Board, Player Bottom */}
      <div className="flex flex-col w-full max-w-[600px] flex-shrink-0">
        <GamePlayerTile 
          username={topLabel} 
          color={topColor === 'w' ? 'white' : 'black'} 
          isActive={currentTurn === topColor && timerRunning}
        />

        <div style={{ width: BOARD_SIZE, height: BOARD_SIZE }} className="rounded-xl overflow-hidden shadow-xl flex-shrink-0 border-4 border-accent/20">
          <Board
            board={board}
            theme={classicTheme}
            highlighted={highlighted}
            onTileClick={onTileClick}
            onDrop={onDrop}
            onDragStart={onDragStart}
            playerColor={playerColor}
            lastMove={lastMove}
            premoves={premoves}
          />
        </div>

        <GamePlayerTile 
          username={bottomLabel} 
          color={bottomColor === 'w' ? 'white' : 'black'} 
          isActive={currentTurn === bottomColor && timerRunning}
          isBottom
        />
      </div>

      {/* Right Column: Game Panel */}
      <div style={{ height: 'min(calc(100vh - 2rem), 600px)' }} className="flex-shrink-0">
        <Card variant="surface" className="flex flex-col gap-2 w-full lg:w-[280px] flex-shrink-0 h-full">
          <div className="px-3 pt-3 flex-shrink-0">
            <Clock timeMs={topTimeMs} label="Opponent Time" isActive={currentTurn === topColor && timerRunning} />
          </div>

          <div className="flex items-center justify-center px-3 flex-shrink-0 pt-2">
            <StatusBadge status={gameStatus} gameOver={gameOver} />
          </div>

          <div className="flex flex-col min-h-0 flex-1 overflow-hidden border-t border-b border-accent/30 mt-2">
            <div className="px-4 py-2 bg-accent/10 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-heading text-primary font-bold uppercase tracking-widest">History</span>
              <span className="text-xs font-body text-text-dark/50">{Math.ceil(moveHistory.length / 2)} moves</span>
            </div>
            <MoveHistory history={moveHistory} />
          </div>

          <div className="px-3 flex-shrink-0">
            <Clock timeMs={bottomTimeMs} label="Your Time" isActive={currentTurn === bottomColor && timerRunning} />
          </div>

          <div className="px-3 pb-3 flex-shrink-0 pt-2">
            <GameControls
              isSpectator={isSpectator} gameOver={gameOver} drawOffered={drawOffered}
              drawOfferSent={drawOfferSent} onResign={handleResign} onDrawOffer={handleDrawOffer}
              onDrawResponse={handleDrawResponse}
            />
          </div>
        </Card>
      </div>

      {promotionMove && <PromotionPopup color={playerColor} theme={classicTheme} onSelect={completePromotion} />}
      {gameOver && <GameEndPopup status={gameStatus} onHome={() => navigate('/')} onNewGame={() => navigate('/gamemode')} />}
    </div>
  );
};

export default ChessGame;