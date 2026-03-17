import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import UserTile from '../../components/UserTile'; 
import FriendsTile from '../../components/FriendsTile';
import LeaderboardTile from '../../components/LeaderboardTile';


interface ChartDataPoint {
  date: string;
  rating: number;
}

interface StatsViewProps {
  chartData: {
    bullet: ChartDataPoint[];
    blitz: ChartDataPoint[];
    rapid: ChartDataPoint[];
  };
}

const mockLeaderboard = [
  { id: '1', username: 'MagnusC', elo: 2882 },
  { id: '2', username: 'HikaruN', elo: 2875 },
  { id: '3', username: 'FabiC', elo: 2830 },
  { id: '4', username: 'IanN', elo: 2790 },
  { id: '5', username: 'DingL', elo: 2780 },
];

const StatsView = ({ chartData }: StatsViewProps) => {
	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Bullet Card */}
			            <GameModeStatsCard 
                title="Bullet"
                icon={<Icons.Zap size={36} />}
                currentRating={chartData.bullet[chartData.bullet.length - 1]?.rating || 1200}
                ratingDelta={chartData.bullet.length > 1 ? chartData.bullet[chartData.bullet.length - 1].rating - chartData.bullet[0].rating : 0}
                chartData={chartData.bullet}
                chartColor="#AEC3B0"
            />

            {/* Blitz Card */}
            <GameModeStatsCard 
                title="Blitz"
                icon={<Icons.Flame size={36} />}
                currentRating={chartData.blitz[chartData.blitz.length - 1]?.rating || 1200}
                ratingDelta={chartData.blitz.length > 1 ? chartData.blitz[chartData.blitz.length - 1].rating - chartData.blitz[0].rating : 0}
                chartData={chartData.blitz}
                chartColor="#AEC3B0"
            />

            {/* Rapid Card */}
            <GameModeStatsCard 
                title="Rapid"
                icon={<Icons.Timer size={36} />}
                currentRating={chartData.rapid[chartData.rapid.length - 1]?.rating || 1200}
                ratingDelta={chartData.rapid.length > 1 ? chartData.rapid[chartData.rapid.length - 1].rating - chartData.rapid[0].rating : 0}
                chartData={chartData.rapid}
                chartColor="#AEC3B0"
            />
		</div>
	);
};

// --- MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
    const [view, setView] = useState<'menu' | 'time-selection'>('menu');
    const [history, setHistory] = useState<GameHistoryItem[]>([]);
		const [leaderboard, setLeaderboard] = useState(mockLeaderboard);

        const [chartData, setChartData] = useState({
      bullet: [],
      blitz: [],
      rapid: [],
    });
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

   //Elo
 useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetch('/api/users/elo-history', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
    .then(r => r.json())
    .then(data => setChartData(data))
    .catch(error => console.error('Error:', error));
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
			<div className="w-full max-w-5xl mx-auto py-8 px-4">
				<div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
				{/* User Profile Tile */}
				<div className="order-1 sm:order-1 sm:col-span-5 lg:col-span-4 flex">
					<UserTile 
						username={stats.username}
						MemberSince={stats.memberSince}
						TotalGames={stats.totalGames}
						AvgScore={stats.avgScore}
					/>
			  </div>
				{/* BOTTOM SECTION: Statistics Dashboard */}
				<div className="order-2 sm:order-3 sm:col-span-12 flex flex-col gap-8 mt-4 w-full">        
						<div className="flex justify-center"> 
							<StatsView chartData={chartData} /> 
						</div>
					<GameHistoryList history={history} />
				</div>

				{/* Friends Tile */}
				<div className="order-3 sm:order-2 sm:col-span-7 lg:col-span-8 flex">
					<FriendsTile />
				</div>
				{/* LEADERBOARD TILE (Moved inside the grid) */}
				<div className="order-4 sm:order-4 sm:col-span-12 flex">
					<LeaderboardTile players={leaderboard} />
				</div>

			</div>
		</div>
	);
};

export default WireframeDashboard;