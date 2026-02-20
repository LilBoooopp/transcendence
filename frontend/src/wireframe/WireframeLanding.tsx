import React from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from './components/Tile';
import * as Icons from 'lucide-react';

export default function WireframeLanding() {
	const navigate = useNavigate();
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
		title: "Solitaire",
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
	<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto">
		
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

	</div>
	);
}
