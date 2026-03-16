import React from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
import GameEndPopup from './GameEndPopup';
import { classicTheme } from './themes';
import { MoveHistory } from './MoveHistory';
import { useSoloChessGame, SoloChessGameProps } from './hooks/useSoloChessGame';
import Button from '../Button';
import { Card } from '../ui/Card';

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
    <div className="flex flex-col items-center font-body w-full">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
        <div className="flex flex-col items-center gap-2" style={{ width: BOARD_SIZE }}>
          <div className="w-full rounded-md bg-secondary text-text-default text-center py-2 px-1 text-[10px] sm:text-xs font-semibold font-body tracking-wide">
            SOLO BOARD - No click · No premoves · You control both sides
          </div>
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

          <div className="flex flex-row items-center justify-between w-full px-1 mt-1 gap-1 min-[425px]:gap-2">
            
            <span className="text-[11px] min-[425px]:text-sm font-body text-text-default whitespace-nowrap">
              {gameOver ? gameStatus : turnIndicator}
            </span>
            
            <div className="flex gap-1 min-[425px]:gap-2">
              <Button 
                variant="secondary" 
                onClick={resetGame} 
                className="text-[10px] min-[425px]:text-sm !px-2 min-[425px]:!px-4 !py-1 min-[425px]:!py-2 !h-fit !min-h-0 !min-w-0 whitespace-nowrap"
              >
                New Game
              </Button>
              <Button 
                variant="tertiary" 
                onClick={() => navigate('/')} 
                className="text-[10px] min-[425px]:text-sm !px-2 min-[425px]:!px-4 !py-1 min-[425px]:!py-2 !h-fit !min-h-0 !min-w-0 whitespace-nowrap"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>

        <Card
          variant="surface"
          className="flex flex-col gap-3 w-full lg:w-[220px] p-4 lg:self-stretch"
          style={{ maxWidth: BOARD_SIZE, maxHeight: BOARD_SIZE }}
        >
          <h3 className="text-sm font-heading font-bold text-text-default">Move History</h3>
          
          <div className="flex-1 overflow-y-auto min-h-[120px]">
            <MoveHistory history={moveHistory} />
          </div>
        </Card>
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