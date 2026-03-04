import React from 'react';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
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

const formatMoveHistory = (history: string[]): React.ReactElement[] => {
  const pairs: React.ReactElement[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    pairs.push(
      <span key={i} className="inline-flex items-center gap-1 text-sm font-mono">
        <span className="text-gray-400 w-5 text-right">{n}.</span>
        <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{history[i]}</span>
        {history[i + 1] && (
          <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{history[i + 1]}</span>
        )}
      </span>
    );
  }
  return (pairs);
};

const statusColor = (status: string, gameOver: boolean): string => {
  if (gameOver) return ('bg-red-100 text-red-700 border-red-200');
  if (status === 'Check!') return ('bg-amber-100 text-amber-700 border-amber-200');
  if (status === 'Playing') return ('bg-emerald-100 text-emerald-700 border-emerald-200');
  return ('bg-gray-100 text-gray-600 border-gray-200');
};

interface TimerPanelProps {
  label: string;
  timeMs: number;
  isActive: boolean;
  side: 'top' | 'bottom';
}

const TimerPanel: React.FC<TimerPanelProps> = ({ label, timeMs, isActive, side }) => {
  const isCritical = timeMs < 60_000 && timeMs > 0;
  return (
    <div
      className={[
        'flex justify-between items-center px-4 py-2.5 rounded-lg transition-all duration-300',
        side === 'bottom' ? 'mt-2' : 'mb-2',
        isActive ? 'bg-stone-800 text-white shadow-lg' : 'bg-stone-100 text-stone-500',
      ].join(' ')}
    >
      <span className={`text-sm font-semibold tracking-wide uppercase ${isActive ? 'text-stone-300' : ''}`}>
        {label}
      </span>
      <span
        className={[
          'text-2xl font-mono font-bold tabular-nums tracking-tight',
          isCritical ? 'text-red-400' : isActive ? 'text-white' : 'text-stone-400',
        ].join(' ')}
      >
        {formatTime(timeMs)}
      </span>
    </div>
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

  const {
    board, moveHistory, highlighted, lastMove, premoves,
    gameStatus, gameOver,promotionMove, timer,
    onTileClick, onDrop, onDragStart, completePromotion,
  } = useChessGame(props);

  const { whiteTimeMs, blackTimeMs, currentTurn, timerRunning } = timer;

  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';
  const topLabel = topColor === 'w' ? 'White' : 'Black';
  const bottomLabel = bottomColor === 'w' ? 'White' : 'Black';
  const topTimeMs = topColor === 'w' ? whiteTimeMs : blackTimeMs;
  const bottomTimeMs = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-screen bg-stone-50">
      <div className="w-full max-w-[600px] flex items.center justify-between">
        <p className="text-sm text-stone-500 font-medium">
          {isSpectator
            ? 'Spectator'
            : <React.Fragment>Playing as <span className="font-bold capitalize text-stone-800">{playerColor}</span></React.Fragment>
          }
        </p>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor(gameStatus, gameOver)}`}>
          {gameStatus}
        </span>
      </div>

      <div className="w-full max-w-[600px]">
        <TimerPanel label={topLabel} timeMs={topTimeMs} isActive={currentTurn === topColor && timerRunning} side="top" />
        <div className="rounded-lg overflow-hidden shadow-2xl shadow-stone-900/40">
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
        <TimerPanel label={bottomLabel} timeMs={bottomTimeMs} isActive={currentTurn === bottomColor && timerRunning} side="bottom" />
      </div>

      {moveHistory.length > 0 && (
        <div className="w-fullmax-w-[600px] bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Move History</h3>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {formatMoveHistory(moveHistory)}
          </div>
        </div>
      )}

      {promotionMove && (
        <PromotionPopup color={playerColor} theme={classicTheme} onSelect={completePromotion} />
      )}
    </div>
  );
};

export default ChessGame;
