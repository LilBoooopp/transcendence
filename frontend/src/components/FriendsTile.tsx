import React, { useState } from 'react';
import { Card } from './ui/Card';
import Button from './Button';
import { UserPlus, Check, X, Eye, Search } from 'lucide-react';

// --- MOCK INTERFACES & DATA ---
interface Friend {
	id: string;
	username: string;
	avatarUrl?: string;
	elo: number;
	status: 'online' | 'offline' | 'in-game';
	gameId?: string;
}

interface FriendRequest {
	id: string;
	username: string;
	avatarUrl?: string;
}


/*

friends:

add friend:

	// /api/friends/request


	// /api/friends/showfriends


	find friends. So find a user and send a friend request

	wait for the answer.
	// ! ask 2 in the same time
	//

	//show friends. It is an array of friends. 

*/

const mockFriends: Friend[] = [
	{ id: '1', username: 'GrandMasterFlash', elo: 1850, status: 'online' },
	{ id: '2', username: 'Rookie123', elo: 1200, status: 'in-game', gameId: 'game-123' },
	{ id: '3', username: 'ChessBot', elo: 3200, status: 'offline' },
];

const mockRequests: FriendRequest[] = [
	{ id: 'req-1', username: 'xX_ChessSlayer_Xx' }
];

export default function FriendsTile() {
	const [friends, setFriends] = useState<Friend[]>(mockFriends);
	const [requests, setRequests] = useState<FriendRequest[]>(mockRequests);
	const [searchName, setSearchName] = useState('');
	const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

	// Handlers for Add Friend
	const handleSendRequest = (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchName.trim()) return;

		// Simulated API call
		if (searchName.toLowerCase() === 'error') {
			setRequestStatus('error');
		} else {
			setRequestStatus('success');
			setSearchName('');
		}
		setTimeout(() => setRequestStatus('idle'), 3000);
	};

	// Handlers for Requests
	const handleAccept = (id: string) => {
		setRequests(prev => prev.filter(req => req.id !== id));
		// Logic to add to friends list would go here after API success
	};

	const handleDeny = (id: string) => {
		setRequests(prev => prev.filter(req => req.id !== id));
	};

	const handleSpectate = (gameId?: string) => {
		console.log('Spectating game:', gameId);
		// Logic to navigate to game board / watch route
	};

	return (
		<Card className="flex flex-col p-5 w-full h-full max-h-[400px] gap-4 overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-gray-700 pb-2">
				<h3 className="text-xl font-heading font-bold text-text-default m-0">Friends</h3>
			</div>

			{/* Add Friend Bar */}
			<form onSubmit={handleSendRequest} className="flex flex-col gap-2 shrink-0">
				<div className="flex gap-2">
					<div className="relative flex-grow">
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Add friend by username..."
							value={searchName}
							onChange={(e) => setSearchName(e.target.value)}
							className="w-full bg-secondary text-text-default text-sm rounded-lg pl-9 pr-3 py-2 border border-transparent focus:border-accent focus:outline-none transition-colors"
						/>
					</div>
					<Button type="submit" variant="secondary" className="!py-2 !px-3 shadow-none">
						Send
					</Button>
				</div>
				{requestStatus === 'success' && <span className="text-xs text-green-400">Request sent successfully!</span>}
				{requestStatus === 'error' && <span className="text-xs text-red-400">User not found.</span>}
			</form>

			<div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
				{/* Pending Requests Section */}
				{requests.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requests ({requests.length})</span>
						{requests.map(req => (
							<div key={req.id} className="flex items-center justify-between bg-primary/50 p-2 rounded-lg border border-gray-700">
								<div className="flex items-center gap-3 truncate">
									<img
										src={req.avatarUrl || `https://ui-avatars.com/api/?name=${req.username}&background=random`}
										alt={req.username}
										className="w-8 h-8 rounded-full object-cover"
									/>
									<span className="text-sm font-semibold text-text-default truncate">{req.username}</span>
								</div>
								<div className="flex gap-1 shrink-0">
									<button onClick={() => handleAccept(req.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors">
										<Check size={16} />
									</button>
									<button onClick={() => handleDeny(req.id)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
										<X size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Friends List Section */}
				<div className="flex flex-col gap-2">
					<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Friends ({friends.length})</span>
					{friends.length === 0 && <span className="text-sm text-gray-500 italic">No friends added yet.</span>}

					{friends.map(friend => (
						<div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/30 transition-colors">
							<div className="flex items-center gap-3 truncate">
								<img
									src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=random`}
									alt={friend.username}
									className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-700"
								/>
								<div className="flex flex-col truncate">
									<span className="text-sm font-semibold text-text-default truncate">{friend.username}</span>
									<span className="text-xs text-gray-400">Avg. Elo: {friend.elo}</span>
								</div>
							</div>

							{/* Status Indicator */}
							<div className="flex items-center justify-center w-8 shrink-0">
								{friend.status === 'offline' && (
									<div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-transparent" title="Offline" />
								)}
								{friend.status === 'online' && (
									<div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Online" />
								)}
								{friend.status === 'in-game' && (
									<button
										onClick={() => handleSpectate(friend.gameId)}
										className="p-1.5 rounded-full bg-accent/20 text-text-default hover:bg-accent/40 hover:scale-110 transition-all"
										title="Watch Game"
									>
										<Eye size={16} />
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
