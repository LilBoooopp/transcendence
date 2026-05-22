import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export interface GameHistoryItem {
  id: string;
  date: string;
  opponent: string;
  opponentId?: string | null;
  result: 'Win' | 'Loss' | 'Draw';
  moves: number;
  mode: 'Bullet' | 'Blitz' | 'Rapid';
  side: 'Black' | 'White';
}
interface GameHistoryListProps {
  history: GameHistoryItem[];
}

function ReportButton({ opponentId, opponentName }: { opponentId: string; opponentName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${opponentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed');
      }
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setReason(''); }, 1500);
    } catch {
      // silent — user sees nothing, report failed
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-text-default/30 hover:text-red-400 transition-colors p-1 rounded"
        title="Report player">
        <Icons.Flag size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-primary rounded-xl shadow-xl p-5 w-full max-w-sm mx-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-text-default flex items-center gap-2">
                <Icons.Flag size={16} className="text-accent" /> Report {opponentName}
              </h3>
              <button onClick={() => setOpen(false)} className="text-text-default/40 hover:text-text-default"><Icons.X size={18} /></button>
            </div>
            {sent ? (
              <p className="text-green-400 text-sm text-center py-2">Report submitted ✓</p>
            ) : (
              <>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Using a chess engine, abusive chat…"
                  rows={3}
                  className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60 resize-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all">Cancel</button>
                  <button onClick={submit} disabled={!reason.trim() || loading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-tertiary hover:bg-tertiary-hover text-text-default transition-all disabled:opacity-40">
                    {loading ? '…' : 'Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function GameHistoryList({ history }: GameHistoryListProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Bullet': return <Icons.Zap size={20} className="text-text-default" />;
      case 'Blitz': return <Icons.Flame size={20} className="text-text-default" />;
      case 'Rapid': return <Icons.Timer size={20} className="text-text-default" />;
      default: return <Icons.HelpCircle size={20} className="text-text-default" />;
    }
  };

  const getResultColor = (result: string) => {
    if (result === 'Win') return 'bg-green-100 text-green-700';
    if (result === 'Loss') return 'bg-red-100 text-red-700';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="w-full bg-primary rounded-xl shadow-sm overflow-hidden">
      <div className="bg-primary px-6 py-3 flex items-center justify-center border-b border-primary-hover">
        <h3 className="text-lg font-heading font-bold text-text-default m-0">Recent Matches</h3>
      </div>
      
      {/* DESKTOP Table Header (Hidden on Mobile) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-contrast text-xs font-body text-text-default uppercase tracking-wider">
        <div className="col-span-1 text-center">Mode</div>
        <div className="col-span-4 text-left">Opponent</div>
        <div className="col-span-2 text-center">Result</div>
        <div className="col-span-2 text-center">Side</div>
        <div className="col-span-1 text-center">Moves</div>
        <div className="col-span-2 text-right">Date</div>
      </div>

      <div className="divide-y divide-primary-hover">
        {history.length === 0 ? (
          <div className="p-6 text-center text-text-default">No games played yet.</div>
        ) : (
          history.map((game, index) => (
            <div 
              key={game.id} 
              className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 md:items-center transition-colors ${
                index % 2 === 0 ? 'bg-primary' : 'bg-contrast-hover'
              }`}
            >
              
              {/* --- MOBILE VIEW (Visible only on small screens) --- */}
              <div className="flex justify-between items-center w-full md:hidden mb-1">
                 <span className="font-bold text-text-default text-base truncate pr-2 flex items-center gap-2">
                   {game.opponent}
                   {game.opponentId && <ReportButton opponentId={game.opponentId} opponentName={game.opponent} />}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold w-16 text-center shrink-0 ${getResultColor(game.result)}`}>
                    {game.result}
                 </span>
              </div>
              <div className="flex justify-between items-center w-full md:hidden text-sm text-text-default/80">
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1" title={game.mode}>
                     {getModeIcon(game.mode)}
                   </div>
                   <span className="capitalize">{game.side}</span>
                   <span>• {game.moves} moves</span>
                 </div>
                 <div className="text-xs text-right whitespace-nowrap pl-2">{game.date}</div>
              </div>

              {/* --- DESKTOP VIEW (Visible only on medium+ screens) --- */}
              {/* Mode */}
              <div className="hidden md:flex col-span-1 justify-center">
                <div title={game.mode}>{getModeIcon(game.mode)}</div>
              </div>

              {/* Opponent */}
              <div className="hidden md:flex col-span-4 text-left items-center gap-2 truncate">
                <span className="font-bold text-text-default text-sm truncate">{game.opponent}</span>
                {game.opponentId && <ReportButton opponentId={game.opponentId} opponentName={game.opponent} />}
              </div>

              {/* Result */}
              <div className="hidden md:flex col-span-2 justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold w-16 text-center ${getResultColor(game.result)}`}>
                  {game.result}
                </span>
              </div>

              {/* Side */}
              <div className="hidden md:flex col-span-2 justify-center items-center gap-2">
                <span className="text-sm text-text-default font-mono capitalize">{game.side}</span>
              </div>

              {/* Moves */}
              <div className="hidden md:flex col-span-1 justify-center items-center gap-2">
                <span className="text-sm text-text-default">{game.moves}</span>
              </div>

              {/* Date */}
              <div className="hidden md:block col-span-2 text-right text-sm text-text-default/70 truncate">
                {game.date}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}