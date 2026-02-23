import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../components/Tile';
import Button from '../components/Button';
import GameHistoryList, { GameHistoryItem } from '../components/GameHistoryList';
import * as Icons from 'lucide-react';

export default function WireframeLanding() {
	const navigate = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Dummy data for the history list
	const history: GameHistoryItem[] = [
		{ id: '1', date: '2023-10-24', opponent: 'GrandMasterFlash', result: 'Win', moves: 34 },
		{ id: '2', date: '2023-10-22', opponent: 'Rookie123', result: 'Loss', moves: 21 },
		{ id: '3', date: '2023-10-20', opponent: 'ChessBot', result: 'Draw', moves: 55 },
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
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
					<h2 className="text-2xl font-heading font-bold mb-4 text-gray-800">Track Your Progress</h2>
					<p className="text-gray-600 mb-8 max-w-md mx-auto">
						Log in to view your match history, analyze past games, and track your rating improvement over time.
					</p>
					<div className="flex justify-center gap-4">
						<Button variant="primary" onClick={() => console.log('Login clicked')}>Log In</Button>
						<Button variant="secondary" onClick={() => console.log('Register clicked')}>Register</Button>
					</div>
				</div>
			)}
		</div>

	</div>
	);
}
