import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Board from './Board';
import PromotionPopup from './PromotionPopup';
import GameEndPopup from './GameEndPopup';
import GamePlayerTile from './GamePlayerTile';
import { Card } from '../ui/Card';
import { classicTheme } from './themes';
import { useChessGame } from './hooks/useChessGame';
import { ChessGameProps } from './types';

import { Clock } from './Clock';
import { StatusBadge } from './StatusBadge';
import { MoveHistory } from './MoveHistory';
import { GameControls } from './GameControls';

const BOARD_SIZE = 'min(calc(100vw - 2rem), 80vh, 600px)';

// 1. FIXED: Moved ReconnectOverlay OUTSIDE the main component
const ReconnectOverlay: React.FC<{ secondsLeft: number }> = ({ secondsLeft }) => {
	const ringColor =
		secondsLeft > 15
			? 'stroke-green-400'
			: secondsLeft > 8
				? 'stroke-amber-400'
				: 'stroke-red-500';

	const textColor =
		secondsLeft > 15 ? 'text-green-300' : secondsLeft > 8 ? 'text-amber-300' : 'text-red-400';

	const RADIUS = 20;
	const CIRC = 2 * Math.PI * RADIUS;
	const MAX = 30;
	const dash = CIRC * (secondsLeft / MAX);

	return (
		<div
			className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
			style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
		>
			<svg width={56} height={56} className="-rotate-90">
				{/* Track */}
				<circle cx={28} cy={28} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={4} />
				{/* progress */}
				<circle
					cx={28}
					cy={28}
					r={RADIUS}
					fill="none"
					strokeWidth={4}
					strokeLinecap="round"
					strokeDasharray={`${dash} ${CIRC}`}
					className={`${ringColor} transition-all duration-1000`}
				/>
			</svg>

			{/* number */}
			<span className={`text-3xl font-bold font-mono -mt-1 ${textColor} transition-colors duration-500`}>
				{secondsLeft}
			</span>

			{/* label */}
			<div className="text-center px-4">
				<p className="text-white text-sm font-semibold">Opponent disconnected</p>
				<p className="text-white/60 text-xs mt-0.5">
					Waiting for them to reconnect...
				</p>
			</div>
		</div>
	);
};

const ChessGame: React.FC<ChessGameProps> = (props) => {
	//Handle gameType state for the "new game" button
	const location = useLocation();
	const gameType = (location.state as { gameType?: string })?.gameType;
	const destination = { bot: '/botmode', online: '/gamemode', solo: '/' }[gameType ?? ''] ?? '/gamemode';

	const { playerColor, isSpectator = false } = props;
	const navigate = useNavigate();

	const {
		board, moveHistory, highlighted, lastMove, premoves,
		gameStatus, gameOver, promotionMove, timer,
		onTileClick, onDrop, onDragStart, completePromotion,
		drawOffered, drawOfferSent,
		handleResign, handleDrawOffer, handleDrawResponse,
		opponentDisconnected, reconnectSecondsLeft,
	} = useChessGame(props);

	const [showPopup, setShowPopup] = React.useState(false);
	React.useEffect(() => { if (gameOver) setShowPopup(true); }, [gameOver]);

	const { whiteTimeMs, blackTimeMs, currentTurn, timerRunning } = timer;

	const topColor = playerColor === 'white' ? 'b' : 'w';
	const bottomColor = playerColor === 'white' ? 'w' : 'b';
	const topLabel = topColor === 'w'
		? (props.players?.white ?? 'White')
		: (props.players?.black ?? 'Black');
	const bottomLabel = bottomColor === 'w'
		? (props.players?.white ?? 'White')
		: (props.players?.black ?? 'Black');
	const topTimeMs = topColor === 'w' ? whiteTimeMs : blackTimeMs;
	const bottomTimeMs = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

	return (
		<div className="flex flex-col items-center justify-center font-body w-full p-4 max-w-7xl mx-auto relative">

			<div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 w-full">

				{/* LEFT COLUMN: Players, Clocks, and Board */}
				<div className="flex flex-col gap-2" style={{ width: BOARD_SIZE }}>

					{/* Top Player + Clock Row */}
					<div className="flex items-stretch justify-between gap-2 w-full h-14 sm:h-[68px]">
						<div className="flex-1 min-w-0">
							<GamePlayerTile username={topLabel} color={topColor === 'w' ? 'white' : 'black'} isActive={currentTurn === topColor && timerRunning} />
						</div>
						<div className="flex-shrink-0">
							{/* Clock */}
							<Clock timeMs={topTimeMs} isActive={currentTurn === topColor && timerRunning} />
						</div>
					</div>

					{/* The Board Container */}
					<div style={{ width: BOARD_SIZE, height: BOARD_SIZE }} className="relative rounded-xl overflow-hidden shadow-xl flex-shrink-0 border-4 border-accent/20">
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

						{opponentDisconnected && !gameOver && (
							<ReconnectOverlay secondsLeft={reconnectSecondsLeft} />
						)}
					</div>

					{/* Bottom Player + Clock Row */}
					<div className="flex items-stretch justify-between gap-2 w-full h-14 sm:h-[68px]">
						<div className="flex-1 min-w-0">
							<GamePlayerTile username={bottomLabel} color={bottomColor === 'w' ? 'white' : 'black'} isActive={currentTurn === bottomColor && timerRunning} />
						</div>
						<div className="flex-shrink-0">
							{/* Clock */}
							<Clock timeMs={bottomTimeMs} isActive={currentTurn === bottomColor && timerRunning} />
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: Game Panel (Status, History, Controls) */}
				{/* Layout fix: lg:!w-[240px] keeps it slim on desktop, style={{width: BOARD_SIZE}} matches board on mobile */}
				<div className="flex flex-col flex-shrink-0 gap-4 lg:!w-[240px]" style={{ width: BOARD_SIZE }}>

					{/* Status Badge */}
					<div className="flex items-center justify-center flex-shrink-0 mt-2 lg:mt-0 w-full">
						<StatusBadge status={gameStatus} gameOver={gameOver} />
					</div>

					{/* Move History Container (Restored your exact original colors!) */}
					<div className="flex flex-col flex-1 min-h-[160px] lg:min-h-0 overflow-hidden rounded-lg bg-primary">
						<div className="px-3 py-2 bg-accent/10 flex items-center justify-between flex-shrink-0 border-b border-accent/20">
							<span className="text-xs font-heading text-text-default font-bold uppercase tracking-widest">History</span>
							<span className="text-xs font-body text-text-default">{Math.ceil(moveHistory.length / 2)} moves</span>
						</div>
						<div className="p-2 flex-1 overflow-hidden flex flex-col">
							<MoveHistory history={moveHistory} />
						</div>
					</div>

					{/* Controls */}
					<div className="flex-shrink-0 w-full">
						<GameControls
							isSpectator={isSpectator} gameOver={gameOver} drawOffered={drawOffered}
							drawOfferSent={drawOfferSent} onResign={handleResign} onDrawOffer={handleDrawOffer}
							onDrawResponse={handleDrawResponse}
						/>
					</div>
				</div>

			</div>

			{promotionMove && <PromotionPopup color={playerColor} theme={classicTheme} onSelect={completePromotion} />}
			{showPopup && <GameEndPopup status={gameStatus} onHome={() => navigate('/')} onNewGame={() => navigate(destination)} onClose={() => setShowPopup(false)} />}
		</div>
	);
};

export default ChessGame;
