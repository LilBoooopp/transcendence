import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../../components/Tile';
import LoginTile from '../../components/LoginTile';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import * as Icons from 'lucide-react';
import { isLoggedIn } from '../../services/auth.service';
import { useNotification } from '../../notifications';

export default function WireframeLanding() {
	const navigate = useNavigate();
	const [loggedIn, setLoggedIn] = useState(false);
	const [history, setHistory] = useState<GameHistoryItem[]>([]);
	const [username, setUsername] = useState<string | null>(null);
	const { push } = useNotification();

	const checkAuth = () => {
		isLoggedIn().then(({ connected, username }) => {
			setLoggedIn(connected);
			setUsername(username ?? null);
			console.log("User is logged in:", connected);
		});
	};

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) return;

		fetch('/api/users/history', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => {
				if (!res.ok) throw new Error('Failed to fetch history');
				return res.json();
			})
			.then((data) => {
				setHistory(data);
			})
			.catch((error) => {
				console.error('Error fetching game history:', error);
				setHistory([]);
			});
	}, [loggedIn]);

	useEffect(() => {
		checkAuth();
	}, []);

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
			title: "AI oponent",
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
			<div className="w-full mt-12">
				{loggedIn ? (
					<GameHistoryList history={history} />
				) : (
					<LoginTile
						onLogin={() => console.log('Login clicked')}
						onRegister={() => console.log('Register clicked')}
						onLoginSuccess={checkAuth}
					/>
				)}
			</div>

		</div>
	);
}