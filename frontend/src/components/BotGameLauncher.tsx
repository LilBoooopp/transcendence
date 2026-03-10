import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socketService } from '../services/socket.service';
import { getTimeControl } from '../types/timeControl';
import { TimerState } from './chessgui';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const BotGameLauncher: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const difficulty = (searchParams.get('difficulty') ?? 'easy') as Difficulty;
  const tcKey = searchParams.get('tc') ?? '600+0';
  const timeControl = getTimeControl(tcKey);

  const [userId] = useState(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  const [gameId] = useState(() => `bot-${Math.random().toString(36).substr(2, 9)}`);
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'error'>('connecting');

  const hasLaunched = useRef(false);

  useEffect(() => {
    if (hasLaunched.current) return;
    hasLaunched.current = true;

    socketService.connect(userId);

    const doLaunch = () => {
      setStatus('waiting');

      let receivedRole: { gameId: string; role: 'white' | 'black' } | null = null;
      let receivedTimer: TimerState | null = null;

      const tryNavigate = () => {
        if (receivedRole && receivedTimer) {
          navigate(`/game/${receivedRole.gameId}`, {
            state: {
              userId,
              role: receivedRole.role,
              tcKey,
              initialTimer: receivedTimer,
              isBot: true,
              difficulty,
            },
          });
        }
      };

      socketService.on('game:role-assigned', (data: { gameId: string; role: 'white' | 'black' }) => {
        receivedRole = data;
        tryNavigate();
      });

      socketService.on('game:timer', (data: TimerState) => {
        if (!receivedTimer) {
          receivedTimer = data;
          tryNavigate();
        }
      });

      socketService.joinBotGame(gameId, difficulty, tcKey);
    };

    if (socketService.isConnected()) {
      doLaunch();
    } else {
      socketService.on('connect', doLaunch);
    }

    return () => {
      socketService.off('game:role-assigned');
      socketService.off('game:timer');
    };
  }, [userId, gameId, difficulty, tcKey, navigate]);

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center font-body">
      <div className="bg-white rounded-2xl shadow-xl border border-accent/30 p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-spin border-t-primary" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl select-none">
            🤖
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-heading font-bold text-text-dark mb-1">
            Setting up opponent...
          </h2>
          <p className="text-sm text-text-dark/60">
            Difficulty:{' '}
            <span className="font-semibold text-primary">
              {DIFFICULTY_LABELS[difficulty]}
            </span>
            {' · '}
            <span className="font-semibold text-primary">
              {timeControl.label}
            </span>
          </p>
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
        )}

        <button
          onClick={() => navigate('botmode')}
          className="w-full py-2.5 rounded-lg border-2 border-primary/40 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
        >
          Cancel
        </button>

      </div>
    </div>
  );
};

export default BotGameLauncher;
