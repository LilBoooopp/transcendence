import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LineChart } from '../../components/charts/LineChart'; 
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import UserTile from '../../components/UserTile'; 

/*
*/


// DUMMY DATA
/*const myRatingData = [
	{ date: 'Week 1', rapid: 1100, blitz: 1050 },
	{ date: 'Week 2', rapid: 1150, blitz: 1080 },
	{ date: 'Week 3', rapid: 1130, blitz: 1120 },
	{ date: 'Week 4', rapid: 1210, blitz: 1190 },
	{ date: 'Week 5', rapid: 1240, blitz: 1205 },
	{ date: 'Week 6', rapid: 1260, blitz: 1214 },
];*/

/*
const bulletHistory = [
	{ date: 'Jan', rating: 1050 },
	{ date: 'Feb', rating: 1080 },
	{ date: 'Mar', rating: 1120 },
	{ date: 'Apr', rating: 1090 },
	{ date: 'May', rating: 1150 },
	{ date: 'Jun', rating: 1180 },
	{ date: 'Jul', rating: 1214 },
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
	{ date: 'Glou', rating: 1260 },
];*/

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

// --- 3. MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
    const [view, setView] = useState<'menu' | 'time-selection'>('menu');
    const [history, setHistory] = useState<GameHistoryItem[]>([]);

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
                    <StatsView chartData={chartData} /> 
                </div>
                <GameHistoryList history={history} />
            </div>
            
        </div>
    );
};

// We only EXPORT the main Dashboard component, so App.tsx can use it.
export default WireframeDashboard;