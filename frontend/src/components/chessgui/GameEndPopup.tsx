import React, { useState } from 'react';
import Button from '../Button';
import { X, Flag } from 'lucide-react';

interface GameEndPopupProps {
	status: string;
	onHome: () => void;
	onNewGame: () => void;
	onClose: () => void;
	opponentUserId?: string | null;
	opponentUsername?: string | null;
}

const GameEndPopup: React.FC<GameEndPopupProps> = ({
	status, onHome, onNewGame, onClose, opponentUserId, opponentUsername,
}) => {
	const [reportOpen, setReportOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function submitReport() {
		if (!reason.trim() || !opponentUserId) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/users/${opponentUserId}/report`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ reason: reason.trim() }),
			});
			if (res.ok) {
				setSent(true);
				setTimeout(() => { setReportOpen(false); setSent(false); setReason(''); }, 1500);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-background-light/80 backdrop-blur-sm z-50 flex items-center justify-center font-body">
			<div className="relative bg-primary rounded-2xl shadow-xl border p-10 text-center flex flex-col items-center gap-6 max-w-sm w-full mx-4">

				<button onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-full text-text-default hover:text-accent transition-colors"
					aria-label="Close popup">
					<X size={24} />
				</button>

				<div className="flex flex-col gap-2">
					<h2 className="text-3xl font-heading font-bold text-text-default">Game Over</h2>
					<p className="text-lg font-medium text-text-default">{status}</p>
				</div>

				<div className="flex w-full gap-3 mt-4 text-text-default">
					<Button variant="secondary" onClick={onHome} className="flex-1">Home</Button>
					<Button variant="secondary" onClick={onNewGame} className="flex-1">New Game</Button>
				</div>

				{opponentUserId && !reportOpen && (
					<button onClick={() => setReportOpen(true)}
						className="flex items-center gap-1.5 text-xs text-text-default/30 hover:text-red-400 transition-colors mt-1">
						<Flag size={13} /> Report {opponentUsername ?? 'opponent'}
					</button>
				)}

				{reportOpen && (
					<div className="w-full flex flex-col gap-3 border-t border-accent/10 pt-4">
						<p className="text-sm text-text-default/60 text-left">Why are you reporting {opponentUsername}?</p>
						{sent ? (
							<p className="text-green-400 text-sm text-center py-1">Report submitted ✓</p>
						) : (
							<>
								<textarea value={reason} onChange={e => setReason(e.target.value)}
									placeholder="e.g. Using a chess engine…"
									rows={3}
									className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60 resize-none text-left" />
								<div className="flex gap-2 justify-end">
									<button onClick={() => setReportOpen(false)}
										className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all">
										Cancel
									</button>
									<button onClick={submitReport} disabled={!reason.trim() || loading}
										className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary hover:bg-tertiary-hover text-text-default transition-all disabled:opacity-40">
										{loading ? '…' : 'Submit'}
									</button>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default GameEndPopup;
