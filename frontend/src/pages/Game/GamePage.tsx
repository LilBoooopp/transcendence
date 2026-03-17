import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChessGame from '../../components/chessgui/ChessGame';
import { socketService } from '../../services/socket.service';
import { getTimeControl } from '../../types/timeControl';
import type { TimerState } from '../../components/chessgui/types';
import { Card } from '../../components/ui/Card';
import { useNotification } from '../../notifications';
const BOARD_SIZE = 'min(calc(100vw - 2rem), 80vh, 600px)';

interface LocationState {
	userId?: string;
	role?: 'white' | 'black';
	tcKey?: string;
	initialTimer?: TimerState;
	isBot?: boolean;
	difficulty?: string;
}

const GamePage: React.FC = () => {
	const { gameId } = useParams<{ gameId: string }>();
	const location = useLocation();
	const navigate = useNavigate();

	const state = (location.state ?? {}) as LocationState;
	const [userId] = useState(() => state.userId ?? localStorage.getItem('userId') ?? '');
	const tcKey = state.tcKey ?? '600+0';
	const timeControl = getTimeControl(tcKey);

	const { push } = useNotification();

	const [role, setRole] = useState<'white' | 'black' | 'spectator' | null>(state.role ?? null);
	const [initialState, setInitialState] = useState<{ fen: string; pgn: string } | null>(null);
	const [initialTimer, setInitialTimer] = useState<TimerState | null>(state.initialTimer ?? null);
	const [initialGameOver, setInitialGameOver] = useState<{ winner: string; result: string } | null>(null);
	const [waiting, setWaiting] = useState(true);

	const hasConnected = useRef(false);

	useEffect(() => {
		if (!gameId || hasConnected.current) return;
		hasConnected.current = true;

		socketService.connect(userId);

		let unsubRole: (() => void) | undefined;
		let unsubState: (() => void) | undefined;
		let unsubTimer: (() => void) | undefined;
		let unsubGameOver: (() => void) | undefined;
		let unsubError: (() => void) | undefined;

		const doJoin = () => {
			unsubRole?.();
			unsubState?.();
			unsubTimer?.();
			unsubGameOver?.();
			unsubError?.();

			unsubError = socketService.on('game:error', (data: { gameId: string; message: string }) => {
				push({
					type: 'error',
					title: 'Game not found',
					message: data.message ?? 'This game does not exist or has ended.',
				});
				navigate('/', { replace: true });
			});

			unsubRole = socketService.on('game:role-assigned', (data: { gameId: string; role: 'white' | 'black' | 'spectator' }) => {
				setRole(data.role);
				setWaiting(false);
			});

			unsubState = socketService.on('game:state', (data: { fen: string; pgn: string }) => {
				setInitialState({ fen: data.fen, pgn: data.pgn });
			});

			unsubTimer = socketService.on('game:timer', (data: TimerState) => {
				setInitialTimer(data);
			});

			unsubGameOver = socketService.on('game:over', (data: { winner: string; result: string }) => {
				setInitialGameOver(data);
			});

			socketService.joinGame(gameId, tcKey, state.role ?? undefined);
		};

		if (socketService.isConnected()) {
			doJoin();
		}

		const unsubConnect = socketService.on('connect', doJoin);

		return () => {
			unsubRole?.();
			unsubState?.();
			unsubTimer?.();
			unsubGameOver?.();
			unsubError?.();
			unsubConnect?.();
			socketService.leaveGame(gameId);
			socketService.disconnect();
			hasConnected.current = false;
		};
	}, [gameId, userId, tcKey, state.role]);

	if (!gameId) {
		return (
			<div className="min-h-screen bg-background-light flex items-center justify-center">
				<p className="text-text-dark/60">No game ID provided.</p>
			</div>
		);
	}

	if (waiting || role === null) {
		return (
			<div className="min-h-screen bg-background-light flex items-center justify-center font-body">
				<Card variant="surface" className="p-10 text-center flex flex-col items-center gap-4">
					<div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-spin border-t-primary" />
					<h2 className="text-xl font-heading font-bold">
						Joining game{gameId ? ` · ${gameId.slice(0, 8)}` : ''}...
					</h2>
					<p className="text-sm opacity-60">Waiting for role assignment</p>
				</Card>
			</div>
		);
	}

	if (role === 'spectator') {
		return (
			<div className="flex flex-col items-center justify-center">
				<div className="bg-accent text-text-dark text-center py-2 text-sm rounded-lg font-semibold font-body" style={{ width: BOARD_SIZE }}>
					Specatating {timeControl.label}
				</div>
				<ChessGame
					gameId={gameId}
					userId={userId}
					playerColor="white"
					isSpectator={true}
					initialState={initialState}
					initialTimer={initialTimer}
					incrementMs={timeControl.incrementMs}
					initialGameOver={initialGameOver}
				/>
			</div>
		);
	}

	return (
		<ChessGame
			gameId={gameId}
			userId={userId}
			playerColor={role}
			isSpectator={false}
			initialState={initialState}
			initialTimer={initialTimer}
			incrementMs={timeControl.incrementMs}
			initialGameOver={initialGameOver}
		/>
	);
};

export default GamePage;
