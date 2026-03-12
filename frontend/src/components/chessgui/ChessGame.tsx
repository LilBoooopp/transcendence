import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
import GameEndPopup from './GameEndPopup';
import GamePlayerTile from './GamePlayerTile'; // 1. Import your new tile
import { Card } from '../ui/Card'; // Ensure you have the surface variant we discussed!
import { classicTheme } from './themes';
import { useChessGame } from './hooks/useChessGame';
import { ChessGameProps } from './types';

const formatTime = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
};

const BOARD_SIZE = 'min(calc(100vw - 2rem), 80vh, 600px)';
const PLAYER_BAR_H = 48;
const PANEL_WIDTH = 200;

// player bar
interface PlayerBarProps {
  label: string;
  isBottom?: boolean;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ label, isBottom }) => ( 
  <div className={`flex items-center gap-2 py-1.5 ${isBottom ? 'mt-1': 'mb-1'}`}>
    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-text-default text-xs font-heading">
      ♟
    </div>
    <span className="font-body font-semibold text-sm text-text-dark">{label}</span>
  </div>
);

// clocks
interface ClockProps {
  timeMs: number;
  label: string;
  isActive: boolean;
}

const Clock: React.FC<ClockProps> = ({ timeMs, label, isActive }) => {
  const isCritical = timeMs < 30_000 && timeMs > 0;
  return (
    <div
      className={[
        'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary text-text-default shadow-md'
          : 'bg-accent/30 text-text-dark',
      ].join(' ')}
    >
      <span className={`text-xs font-body font-medium uppercase tracking-wider ${isActive ? 'text-accent' : 'text-text-dark/50'}`}>
        {label}
      </span>
      <span
        className={[
          'text-xl font-mono font-bold tabular-nums tracking-tight',
          isCritical ? 'text-red-500' : '',
        ].join(' ')}
        >
        {formatTime(timeMs)}
      </span>
    </div>
  );
};

interface MoveHistoryProps {
  history: string[];
  currentMoveIndex?: number;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {pairs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-text-dark/30 text-sm font-body italic">
          No moves yet
        </div>
      ) : (
        <table className="w-full text-sm font-mono">
          <tbody>
              {pairs.map(({ n, white, black }) => (
                <tr
                  key={n}
                  className="group hover:bg-accent/20 transition-colors duration-100"
                >
                  <td className="w-8 pl-3 py-0.5 text-text-dark/40 font-body text-xs select-none">
                    {n}
                  </td>
                  <td className="w-1/2 py-0.5 pr-3 font-semibold text-text-dark cursor-pointer hover:text-primary transition-colors">
                    {white}
                  </td>
                  <td className="w-1/2 py-0.5 pr-3 font-semibold text-text-dark cursor-pointer hover:text-primary transition-colors">
                    {black ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

// game controls

interface GameControlsProps {
  isSpectator: boolean;
  gameOver: boolean;
  drawOfferSent: boolean;
  drawOffered: boolean;
  onResign: () => void;
  onDrawOffer: () => void;
  onDrawResponse: (accepted: boolean) => void;
}

const GameControls: React.FC<GameControlsProps> = ({ isSpectator, gameOver, drawOfferSent, drawOffered, onResign, onDrawOffer, onDrawResponse }) => {
  if (isSpectator || gameOver) return (null);

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
    <div className="flex gap-2 pt-2 border-t border-accent/30">
      <button
        onClick={onDrawOffer}
        disabled={drawOfferSent}
        className={[
          'flex-1 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors',
          drawOfferSent
            ? 'bg-accent/20 text-text-dark/30 cursor-not-allowed'
            : 'bg-primary/10 hover:bg-primary/20 text-primary',
        ].join(' ')}
        title={drawOfferSent ? 'Draw offer sent, waiting...' : 'Offer a draw'}
      >
        {drawOfferSent ? '½ Waiting...' : '½ Draw'}
      </button>
      <button
        onClick={onResign}
        className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
        title="Resign the game"
      >
        ⚑ Resign
      </button>
    </div>
  );
};


// Status badge

const StatusBadge: React.FC<{ status: string, gameOver: boolean}> = ({ status, gameOver }) => {
  const colors = gameOver
    ? 'bg-red-100 text-red-700 boarder-red-200'
    : status === 'Check!'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : status === 'Playing'
    ? 'bg-accent/40 text-secondary border-accent'
    : 'bg-primary/10 text-primary border-primary/20';

  return (
    <span className={`text-xs font-body font-semibold px-2.5 py-0.5 rounded-full border ${colors}`}>
      {status}
    </span>
  );
};


/**
 * Dropin multiplayer chess component
 * @example
 *  import ChessGame from './chessgui';
 *  <ChessGame gameId="abc-123" userId="user-456" playerColor="white" />
*/

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
	const handleGoHome = () => { navigate('/'); };
	const handleNewGame = () => { navigate('/gamemode'); };

  return (
   <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-4 w-full max-w-7xl mx-auto font-body relative">

      {/* Left Column: Player Top, Board, Player Bottom */}
      <div className="flex flex-col w-full max-w-[600px] flex-shrink-0">
        <GamePlayerTile 
          username={topLabel} 
          color={topColor === 'w' ? 'white' : 'black'} 
          isActive={currentTurn === topColor && timerRunning}
        />

        <div
          style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          className="rounded-xl overflow-hidden shadow-xl flex-shrink-0 border-4 border-accent/20"
        >
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
      {/* On mobile, it takes full width. On desktop, it takes a fixed width of 280px */}
      <div style={{ height: 'min(calc(100vh - 2rem), 600px)' }} className="flex-shrink-0">
        <Card
          variant="surface"
          className="flex flex-col gap-2 w-full lg:w-[280px] flex-shrink-0"
        >
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
      {gameOver && <GameEndPopup status={gameStatus} onHome={() => navigate('/')} onNewGame={() => navigate('/games')} />}
    </div>
  );
};

export default ChessGame;
