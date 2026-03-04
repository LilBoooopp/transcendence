import React, { useRef, useEffect } from 'react';
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
}

const GameControls: React.FC<GameControlsProps> = ({ isSpectator, gameOver }) => {
  if (isSpectator || gameOver) return (null);
  return (
    <div className="flex gap-2 pt-2 border-t border-accent/30">
      <button
        className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-150"
        title="Offer Draw"
      >
        ½ Draw
      </button>
      <button
        className="flex-1 py-1.5 rounded-lg text-xs font-body font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors duration-150"
        title="Resign"
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
    <div className="flex flex-wrap justify-center items-start gap-3 p-4 bg-background-light min-h-screen font-body">

      {/* Left = board + player bars */}
      <div className="flex flex-col flex-shrink-0">
        <PlayerBar label={topLabel} />

        <div
          style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          className="rounded-lg overflow-hidden shadow-xl flex-shrink-0"
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

        <PlayerBar label={bottomLabel} isBottom />
      </div>

      {/* Right panel */}
      <div
        className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-white shadow-md overflow-hidden flex-shrink-0"
        style={{
          width: `${PANEL_WIDTH}px`,
          height: BOARD_SIZE,
          marginTop: `${PLAYER_BAR_H}px`,
        }}
      >
        {/* Opponent clock */}
        <div className="px-2 pt-2 flex-shrink-0">
          <Clock
            timeMs={topTimeMs}
            label={topLabel}
            isActive={currentTurn === topColor && timerRunning}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-center px-2 flex-shrink-0">
          <StatusBadge status={gameStatus} gameOver={gameOver} />
        </div>

        {/* Move history */}
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden border-t border-b border-accent/30">
          <div className="px-3 py-1.5 bg-accent/20 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-heading text-primary font-semibold uppercase tracking-wider">Move</span>
            <span className="text-xs font-body text-text-dark/40">{Math.ceil(moveHistory.length / 2)} / —</span>
          </div>
          <MoveHistory history={moveHistory} />
        </div>

        {/* your clock */}
        <div className="px-2 flex-shrink-0">
          <Clock
            timeMs={bottomTimeMs}
            label={bottomLabel}
            isActive={currentTurn === bottomColor && timerRunning}
          />
        </div>

        {/* Game Controls */}
        <div className="px-2 pb-2 flex-shrink-0">
          <GameControls isSpectator={isSpectator} gameOver={gameOver} />
        </div>
      </div>

      {/* promotion popup */}
      {promotionMove && (
        <PromotionPopup
          color={playerColor}
          theme={classicTheme}
          onSelect={completePromotion}
        />
      )}
    </div>
  );
};

export default ChessGame;
