import React from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
import GameEndPopup from './GameEndPopup';
import { classicTheme } from './themes';
import { MoveHistory } from './MoveHistory';
import { useSoloChessGame, SoloChessGameProps } from './hooks/useSoloChessGame';
import Button from '../Button';

const BOARD_SIZE = 'min(calc(100vw - 2rem), 80vh, 600px)';

/**
 * A fully offline, two-color-in-one chess board.
 * No WS, no timers, no premoves.
 * The same player controls both White and Black.
 */
const SoloChessGame: React.FC<SoloChessGameProps> = (props) => {
  const { playerColor } = props;
  const navigate = useNavigate();

  const {
    board,
    moveHistory,
    highlighted,
    lastMove,
    premoves,
    gameStatus,
    gameOver,
    currentTurn,
    promotionMove,
    onTileClick,
    onDrop,
    onDragStart,
    completePromotion,
    resetGame,
  } = useSoloChessGame(props);

  const topColor = playerColor === 'white' ? 'black' : 'white';
  const bottomColor = playerColor;
  const turnIndicator = gameOver
    ? null
    : (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold font-body"
        style={{
          background: currentTurn === 'white' ? '#f8f8f2' : '#1a1a2e',
          color: currentTurn === 'white' ? '#1a1a2e' : '#f8f8f2',
          border: '1.5px solid rgba(128,128,128,0.25)',
        }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: currentTurn === 'white' ? '#1a1a2e' : '#f8f8f2' }}
        />
        {currentTurn === 'white' ? 'White to move' : 'Black to move'}
      </span>
    );

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-4 font-body">
      {/* Solo mode banner */}
      <div className="absolute top-0 left-0 right-0 bg-accent/10 border-b border-accent/20 text-accent text-center py-1.5 text-xs font-semibold font-body tracking-wide">
        SOLO BOARD - No click · No premoves · You control both sides
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mt-10">
        {/* Board column */}
        <div className="flex flex-col items-center gap-2" style={{ width: BOARD_SIZE }}>
          <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
            <Board
              board={board}
              highlighted={highlighted}
              lastMove={lastMove}
              premoves={premoves}
              onTileClick={onTileClick}
              onDrop={onDrop}
              onDragStart={onDragStart}
              playerColor={playerColor}
              theme={classicTheme}
            />

            {promotionMove && (
              <PromotionPopup
                color={currentTurn}
                theme={classicTheme}
                onSelect={completePromotion}
              />
            )}
          </div>

          <div className="flex items-center justify-between w-full px-1 mt-1">
            <span className="text-sm font-body text-text-default/70">
              {gameOver ? gameStatus : turnIndicator}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={resetGame} className="text-xs px-3 py-1.5">
                New Game
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')} className="text-xs px-3 py-1.5">
                Exit
              </Button>
            </div>
          </div>
        </div>

        <div
          className="hidden lg:flex flex-col gap-3 self-stretch"
          style={{ width: 200, maxHeight: BOARD_SIZE }}
        >
          <h3 className="text-sm font-heading font-bold text-text-default">Move History</h3>
          <div className="flex-1 overflow-y-auto">
            <MoveHistory history={moveHistory} />
          </div>
        </div>
      </div>

      {gameOver && (
        <GameEndPopup
          status={gameStatus}
          onHome={() => navigate('/')}
          onNewGame={resetGame}
          onClose={resetGame}
        />
      )}
    </div>
  );
};

export default SoloChessGame;
