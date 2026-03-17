import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const difficulty = (searchParams.get('difficulty') ?? 'easy') as Difficulty;
  const tcKey = searchParams.get('tc') ?? '600+0';
  const timeControl = getTimeControl(tcKey);

  const [userId] = useState(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  const [gameId] = useState(() => `bot-${Math.random().toString(36).substr(2, 9)}`);
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'error'>('connecting');

  const hasLaunched = useRef(false);

  const [isAllowed, setIsAllowed] = useState(false);
  const validatedRef = React.useRef(false); 

  useEffect(() => {
    if (validatedRef.current) return;
    const nav = location.state as { fromBotMode?: boolean; mm_token?: string } | null;
    const raw = sessionStorage.getItem('mm_flow');

    if (!nav?.fromBotMode || !nav.mm_token || !raw) {
      console.log("DEBUG : ❌ No mm_token or invalid access to matchmaking.");
      navigate('/botmode');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { mm_token: string; tcKey: string; ts: number };
      const toOld = Date.now() - parsed.ts > 20000; 
      const tokenMismatch = nav.mm_token !== parsed.mm_token || parsed.tcKey !== "600%2B0";

      if (toOld || tokenMismatch) {
        console.log("DEBUG : ❌ Flow mm_token expired or invalid.");
        sessionStorage.removeItem('mm_flow');
        navigate('/botmode', { replace: true });
        return;
      }
      validatedRef.current = true;
      sessionStorage.removeItem('mm_flow');
      console.log('DEBUG : ✅ Matchmaking flow token validated successfully.');
      setIsAllowed(true);
    } catch (error) {
      sessionStorage.removeItem('mm_flow');
      navigate('/botmode');
    }
  }, [location.state, navigate, tcKey]);


  useEffect(() => {
    if (!isAllowed) return;
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
              gameType: "bot",
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
  }, [isAllowed, userId, gameId, difficulty, tcKey, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-body">
      <div className="bg-primary rounded-xl shadow-lg p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-secondary animate-spin border-t-accent" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl select-none">
            🤖
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-heading font-bold text-text-default mb-2">
            Setting up opponent...
          </h2>
          <p className="text-sm text-text-default/80">
            Difficulty:{' '}
            <span className="font-semibold text-accent">
              {DIFFICULTY_LABELS[difficulty]}
            </span>
            {' · '}
            <span className="font-semibold text-accent">
              {timeControl.label}
            </span>
          </p>
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
        )}

        {/* Cancel Button */}
        <button
          onClick={() => navigate('/botmode')}
          className="w-full py-2.5 mt-2 rounded font-bold bg-secondary hover:bg-secondary-hover text-text-default transition-colors"
        >
          Cancel
        </button>

      </div>
    </div>
  );
};

export default BotGameLauncher;