import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LineChart } from '../../components/charts/LineChart'; 
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import UserTile from '../../components/UserTile'; 

// DUMMY DATA
const myRatingData = [
	{ date: 'Week 1', rapid: 1100, blitz: 1050 },
	{ date: 'Week 2', rapid: 1150, blitz: 1080 },
	{ date: 'Week 3', rapid: 1130, blitz: 1120 },
	{ date: 'Week 4', rapid: 1210, blitz: 1190 },
	{ date: 'Week 5', rapid: 1240, blitz: 1205 },
	{ date: 'Week 6', rapid: 1260, blitz: 1214 },
];

const blitzHistory = [
	{ date: 'Jan', rating: 1050 },
	{ date: 'Feb', rating: 1080 },
	{ date: 'Mar', rating: 1120 },
	{ date: 'Apr', rating: 1090 },
	{ date: 'May', rating: 1150 },
	{ date: 'Jun', rating: 1180 },
	{ date: 'Jul', rating: 1214 },
];

const rapidHistory = [
	{ date: 'Jan', rating: 1250 },
	{ date: 'Feb', rating: 1280 },
	{ date: 'Mar', rating: 1300 },
	{ date: 'Apr', rating: 1305 },
	{ date: 'May', rating: 1290 },
	{ date: 'Jun', rating: 1285 },
	{ date: 'Jul', rating: 1260 },
];


const StatsView = () => {
	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Bullet Card */}
			<GameModeStatsCard 
				title="Bullet"
				icon={<Icons.Zap size={36} />}
				currentRating={1214}
				ratingDelta={+114}
				chartData={blitzHistory}
				chartColor="#AEC3B0" // Replaced themeColors with actual hex
			/>

			{/* Blitz Card */}
			<GameModeStatsCard 
				title="Blitz"
				icon={<Icons.Flame size={36} />}
				currentRating={1260}
				ratingDelta={-40}
				chartData={rapidHistory}
				chartColor="#AEC3B0" // Replaced themeColors with actual hex
			/>

			{/* Rapid Card */}
			<GameModeStatsCard 
				title="Rapid"
				icon={<Icons.Timer size={36} />}
				currentRating={1260}
				ratingDelta={-40}
				chartData={rapidHistory}
				chartColor="#AEC3B0" // Replaced themeColors with actual hex
			/>
		</div>
	);
};

// --- 3. MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
    const [view, setView] = useState<'menu' | 'time-selection'>('menu');
    const [history, setHistory] = useState<GameHistoryItem[]>([]);

	//user state
	const [stats, setStats] = useState({
	username: '',
	memberSince: '',
	totalGames: 0,
	avgScore: 0,
	blitzRating: 0,
	rapidRating: 0,
	bulletRating: 0,
});

// useEffect pour fetcher les stats
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetch('/api/users/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    })
    .then((data) => {
      setStats(data);
    })
    .catch((error) => {
      console.error('Error fetching stats:', error);
    });
}, []);

	// history
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
    }, []);

    return (
        <div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto py-8 px-4">
            
            {/* TOP SECTION: User Profile Tile */}
            <div className="w-full flex justify-center">
                <UserTile 
                    username={stats.username}
					MemberSince={stats.memberSince}
					TotalGames={stats.totalGames}
					AvgScore={stats.avgScore}
                />
            </div>

            {/* BOTTOM SECTION: Statistics Dashboard */}
            <div className="w-full mt-8">        
                <div className="flex justify-center mb-8"> 
                    <StatsView /> 
                </div>
                <GameHistoryList history={history} />
            </div>
            
        </div>
    );
};

// We only EXPORT the main Dashboard component, so App.tsx can use it.
export default WireframeDashboard;