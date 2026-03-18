import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Tile from '../../components/Tile';
import LoginTile from '../../components/LoginTile';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import * as Icons from 'lucide-react';
import { isLoggedIn } from '../../services/auth.service';
import { useNotification } from '../../notifications';

export default function WireframeLanding() {
	const navigate = useNavigate();
	const location = useLocation();
	const [loggedIn, setLoggedIn] = useState(false);
	const [history, setHistory] = useState<GameHistoryItem[]>([]);
	const [username, setUsername] = useState<string | null>(null);
	const [historyError, setHistoryError] = useState<'rate-limited' | 'error' | null>(null);
	const { push } = useNotification();

	const checkAuth = () => {
		isLoggedIn().then(({ connected, username }) => {
			setLoggedIn(connected);
			if (connected) {
				setUsername(username ?? null);
			} else {
				setUsername(null);
				setHistory([]);
			}
		});
	};

	useEffect(() => {
		const handleAuthChange = () => checkAuth();
		window.addEventListener('auth-change', handleAuthChange);
		checkAuth();
		return () => window.removeEventListener('auth-change', handleAuthChange);
	}, []);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token || !loggedIn) return;

		fetch('/api/users/history', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
			.then(res => {
				if (res.status === 429) throw new Error('rate-limited');
				if (!res.ok) throw new Error('error');
				return res.json();
			})
			.then(data => {
				setHistory(data);
				setHistoryError(null);
			})
			.catch(err => {
				setHistoryError(err.message);
				setHistory([]);
			});
	}, [loggedIn]);

	const features = [
		{
			title: "Join Game",
			description: "Find an open lobby and jump into the action.",
			icon: <Icons.Swords size={36} />,
			action: () => navigate('/gamemode')
		},
		{
			title: "Solo",
			description: "Play single player.",
			icon: <Icons.User size={36} />,
			action: () => navigate('/solo')
		},
		{
			title: "AI opponent",
			description: "Challenge the computer engine.",
			icon: <Icons.Bot size={36} />,
			action: () => navigate('/botmode')
		}
	];

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto py-12">

			<h1 className="text-4xl font-heading font-bold mb-12 text-center">
				{username ? `Welcome ${username}` : 'Welcome to 42 Chess!'}
			</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
				{features.map((feature, index) => (
					<Tile
						key={index}
						title={feature.title}
						description={feature.description}
						icon={feature.icon}
						onClick={feature.action}
					/>
				))}
			</div>

			{/* HISTORY / LOGIN SECTION */}
			<div className="w-full mt-12 flex justify-center">
				{loggedIn ? (
					historyError === 'rate-limited' ? (
						<div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
							Too many requests — please wait a moment.
						</div>
					) : historyError === 'error' ? (
						<div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
							Failed to load history.
						</div>
					) : (
						<GameHistoryList history={history} />
					)
				) : (
					<LoginTile
						onLogin={() => console.log('Login clicked')}
						onRegister={() => console.log('Register clicked')}
						onLoginSuccess={() => {
							checkAuth();
							window.dispatchEvent(new Event('auth-change'));
						}}
					/>
				)}
			</div>

		</div>
	);
}