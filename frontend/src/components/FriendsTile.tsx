import React, { useState, useEffect } from 'react';
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

export default function FriendsTile() {
	//state
	const [friends, setFriends] = useState<Friend[]>([]);
	const [requests, setRequests] = useState<FriendRequest[]>([]);
	const [searchName, setSearchName] = useState('');
	const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

	//add by syl to get friends
	useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/friends', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setFriends(data))
      .catch(error => console.error('Error fetching friends:', error));
    }, []);

  // add by syl to get friends requests
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch('/api/friends/request', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(error => console.error('Error fetching requests:', error));
    }, []);  

	// Handlers for Add Friend
    const handleSendRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchName.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setRequestStatus('error');
            return;
        }

        fetch('/api/friends', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ toUsername: searchName }),
        })
//            .then(res => {
//    if (!res.ok) throw new Error('Failed to send friend request');
//
//    return res.json();
//})
		    .then(res => {
    console.log('Status:', res.status);
    if (!res.ok) {
        return res.text().then(text => {
            throw new Error(`Status ${res.status}: ${text}`);
        });
    }
    return res.json();
})
//remplacer le truc au dessus par ce qui est masqué
//

            .then(data => {
                setRequestStatus('success');
                setSearchName('');
            })
            .catch(error => {
                console.error('Error:', error);
                setRequestStatus('error');
            })
            .finally(() => {
                setTimeout(() => setRequestStatus('idle'), 3000);
            });
    };

const handleAccept = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`/api/friends/accept/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) throw new Error('Failed to accept request');

        // Récupérer le nouvel ami depuis la réponse
        const newFriend = await res.json();
        
        // Ajouter l'ami à la liste
        setFriends(prev => [...prev, newFriend]);
        
        // Supprimer la requête
        setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
        console.error('Error accepting request:', error);
    }
};

const handleDeny = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`/api/friends/reject/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) throw new Error('Failed to deny request');

        // Supprimer la requête
        setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
        console.error('Error denying request:', error);
    }
};
  // a voir
	const handleSpectate = (gameId?: string) => {
		console.log('Spectating game:', gameId);
		// Logic to navigate to game board / watch route
	};

	const getAvatarUrl = (avatarUrl?: string, username?: string) => {
  if (!avatarUrl) {
    // Pas d'avatar → fallback ui-avatars
    return `https://ui-avatars.com/api/?name=${username}&background=random`;
  }
  
  // Si c'est déjà une URL complète
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  // Si c'est un chemin relatif, l'ajouter à la base URL
    const filename = avatarUrl.replace(/^\/?(api\/)?uploads\//, '');
  return `/api/uploads/${filename}`;
};
	//rendering
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
										src={getAvatarUrl(req.avatarUrl, req.username)}
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
									src={getAvatarUrl(friend.avatarUrl, friend.username)}
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
