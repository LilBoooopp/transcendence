import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socketService } from '../services/socket.service';
import { getTimeControl } from '../types/timeControl';

const MatchmakingWaiting: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tcKey = searchParams.get('tc') ?? '600+0';
  const timeControl = getTimeControl(tcKey);

  const [userId] = useState(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  const [dots, setDots] = useState('');
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    const timeInterval = setInterval(() => setWaitSeconds(s => s + 1), 1000);
    return () => { clearInterval(dotInterval); clearInterval(timeInterval); };
  }, []);

  useEffect(() => {
    socketService.connect(userId);

    const doMatchmaking = () => {
      socketService.on('matchmaking:found', (data: { gameId: string; role: 'white' | 'black' }) => {
        navigate(`/game/${data.gameId}`, {
          state: { userId, role: data.role, tcKey },
        });
      });

      socketService.joinMatchmaking(tcKey);
    };

    if (socketService.isConnected()) {
      doMatchmaking();
    } else {
      socketService.on('connect', doMatchmaking);
    }

    return () => {
      socketService.off('matchmaking:found');
      socketService.off('matchmaking:cancelled');
      socketService.cancelMatchmaking();
    };
  }, [userId, tcKey, navigate]);

  const handleCancel = () => {
    socketService.cancelMatchmaking();
    navigate('/gamemode');
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center font-body">
      <div className="bg-white rounded-2xl shadow-xl border border-accent/30 p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        {/* anim chess piece spnning */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-spin border-t-primary" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl select-none">
            ♟
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-heading font-bold text-text-dark mb-1">
            Finding Opponent{dots}
          </h2>
          <p className="text-sm text-text-dark/60">
            Time contol: <span className="font-smibold text-primary">{timeControl.label}</span>
          </p>
        </div>

        <button
          onClick={handleCancel}
          className="w-full py-2.5 rounded-lg border-2 border-primary/40 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MatchmakingWaiting;
