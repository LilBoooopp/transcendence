import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../components/Tile_w_select';
import * as Icons from 'lucide-react';

export default function WireframeGameMode() {
	const navigate = useNavigate();

	// State for selections
	const [bulletOption, setBulletOption] = useState('1 min');
	const [blitzOption, setBlitzOption] = useState('3 min');
	const [rapidOption, setRapidOption] = useState('10 min');

	const handlePlay = (mode: string, option: string) => {
		console.log(`Starting ${mode} game (${option})`);
		// In a real app, you'd pass these params to the game creation logic
		navigate('/wireframe'); 
	};

	return (
	<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto py-12">
		
		<h1 className="text-4xl font-heading font-bold mb-12 text-center">
			Select Game Mode
		</h1>

		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
			<Tile 
				title="Bullet"
				description="Super fast! 1 to 2 minutes."
				icon={<Icons.Zap size={36} />}
				options={['1 min', '1 | 1', '2 | 1']}
				selectedOption={bulletOption}
				onSelect={setBulletOption}
				onClick={() => handlePlay('Bullet', bulletOption)}
			/>

			<Tile 
				title="Blitz"
				description="Fast paced. 3 to 5 minutes."
				icon={<Icons.Flame size={36} />}
				options={['3 min', '3 | 2', '5 min', '5 | 3']}
				selectedOption={blitzOption}
				onSelect={setBlitzOption}
				onClick={() => handlePlay('Blitz', blitzOption)}
			/>

			<Tile 
				title="Rapid"
				description="Standard play. 10+ minutes."
				icon={<Icons.Timer size={36} />}
				options={['10 min', '15 | 10', '30 min']}
				selectedOption={rapidOption}
				onSelect={setRapidOption}
				onClick={() => handlePlay('Rapid', rapidOption)}
			/>
		</div>

	</div>
	);
}
