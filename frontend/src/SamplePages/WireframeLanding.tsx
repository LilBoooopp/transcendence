import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../components/Tile';
import LoginTile from '../components/LoginTile';
import GameHistoryList, { GameHistoryItem } from '../components/GameHistoryList';
import * as Icons from 'lucide-react';

export default function WireframeLanding() {
	const navigate = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Dummy data for the history list
	const history: GameHistoryItem[] = [
		{ id: '1', date: '2023-10-24', opponent: 'GrandMasterFlash', result: 'Win', moves: 34, mode: 'Blitz', accuracy: 89 },
		{ id: '2', date: '2023-10-22', opponent: 'Rookie123', result: 'Loss', moves: 21, mode: 'Bullet', accuracy: 65 },
		{ id: '3', date: '2023-10-20', opponent: 'ChessBot', result: 'Draw', moves: 55, mode: 'Rapid', accuracy: 92 },
	];

	const features = [
	{
		title: "Create Game",
		description: "Start a new game against AI or local opponents.",
		icon: <Icons.PlusCircle size={36} />,
		action: () => navigate('/wireframe/games')
	},
	{
		title: "Join Game",
		description: "Find an open lobby and jump into the action.",
		icon: <Icons.Swords size={36} />,
		action: () => navigate('/wireframe')
	},
	{
		title: "Solo",
		description: "Play single player puzzles and challenges.",
		icon: <Icons.User size={36} />,
		action: () => navigate('/wireframe/social')
	},
	{
		title: "AI oponent",
		description: "Challenge the computer engine.",
		icon: <Icons.Bot size={36} />,
		action: () => console.log("Navigate to settings")
	}
	];

	return (
	<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto py-12">
		
		<h1 className="text-4xl font-heading font-bold mb-12 text-center">
		Welcome to 42 Chess!
		</h1>

		<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-2xl lg:max-w-full">
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
			{/* Dev Toggle: Remove this when real auth is implemented */}
			<div className="flex justify-center mb-4">
				<button 
					onClick={() => setIsLoggedIn(!isLoggedIn)} 
					className="text-xs text-gray-400 hover:text-gray-600 underline"
				>
					[Dev: Toggle Login State]
				</button>
			</div>

			{isLoggedIn ? (
				<GameHistoryList history={history} />
			) : (
				<LoginTile 
					onLogin={() => console.log('Login clicked')} 
					onRegister={() => console.log('Register clicked')} 
				/>
			)}
		</div>

	</div>
	);
}
