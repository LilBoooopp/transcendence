import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../components/Tile';
import LoginTile from '../components/LoginTile';
import GameHistoryList, { GameHistoryItem } from '../components/GameHistoryList';
import * as Icons from 'lucide-react';
import { isLoggedIn } from '../services/auth.service';


export default function WireframeLanding() {
    const navigate = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);

    const checkAuth = () => {
        isLoggedIn().then(({ connected }) => {
            setLoggedIn(connected);
			console.log("User is logged in:", connected);
        });
    };

    useEffect(() => {
        checkAuth();
    }, []);

	const history: GameHistoryItem[] = [
		{ id: '1', date: '2023-10-24', opponent: 'GrandMasterFlash', result: 'Win', moves: 34, mode: 'Blitz', accuracy: 89 },
		{ id: '2', date: '2023-10-22', opponent: 'Rookie123', result: 'Loss', moves: 21, mode: 'Bullet', accuracy: 65 },
		{ id: '3', date: '2023-10-20', opponent: 'ChessBot', result: 'Draw', moves: 55, mode: 'Rapid', accuracy: 92 },
	];

/*	const history: GameHistoryItem[] = 	await fetch('/api/users/stat' {
				method: 'GET',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					});*/








	const features = [
		{
			title: "Join Game",
			description: "Find an open lobby and jump into the action.",
			icon: <Icons.Swords size={36} />,
			action: () => navigate('/gamemode')
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
			action: () => navigate('/botmode')
		}
	];

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-5xl mx-auto py-12">

			<h1 className="text-4xl font-heading font-bold mb-12 text-center">
				Welcome to 42 Chess!
			</h1>

			<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-2xl lg:max-w-full">
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
        	        <>
        	            <GameHistoryList history={history} />
						{/*Test button to logout (waiting for bastian to add a clean one)*/}
        	            <button
        	                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        	                onClick={async () => {
        	                    try {
        	                        await fetch('/api/auth/logout', {
        	                            method: 'POST',
        	                            headers: {
        	                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
        	                            },
        	                        });
        	                        localStorage.removeItem('token');
        	                        setLoggedIn(false);
        	                    } catch (error) {
        	                        console.error('Logout failed', error);
        	                    }
        	                }}
        	            >
        	                Logout
        	            </button>
        	        </>
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
