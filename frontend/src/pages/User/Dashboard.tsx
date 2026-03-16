import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import UserTile from '../../components/UserTile'; 
import FriendsTile from '../../components/FriendsTile';

// --- DUMMY DATA ---
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

const history: GameHistoryItem[] = [
	{ id: '1', date: '2023-10-24', opponent: 'GrandMasterFlash', result: 'Win', moves: 34, mode: 'Blitz', accuracy: 89 },
	{ id: '2', date: '2023-10-22', opponent: 'Rookie123', result: 'Loss', moves: 21, mode: 'Bullet', accuracy: 65 },
	{ id: '3', date: '2023-10-20', opponent: 'ChessBot', result: 'Draw', moves: 55, mode: 'Rapid', accuracy: 92 },
];

// --- STATS VIEW COMPONENT ---
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
				chartColor="#AEC3B0"
			/>

			{/* Blitz Card */}
			<GameModeStatsCard 
				title="Blitz"
				icon={<Icons.Flame size={36} />}
				currentRating={1260}
				ratingDelta={-40}
				chartData={rapidHistory}
				chartColor="#AEC3B0"
			/>

			{/* Rapid Card */}
			<GameModeStatsCard 
				title="Rapid"
				icon={<Icons.Timer size={36} />}
				currentRating={1260}
				ratingDelta={-40}
				chartData={rapidHistory}
				chartColor="#AEC3B0"
			/>
		</div>
	);
};

// --- MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
  const [view, setView] = useState<'menu' | 'time-selection'>('menu');

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      
      {/* CSS Grid handles the responsive layout:
        - Mobile (grid-cols-1, < 640px): 
          Order: User (1), Stats (2), Friends (3)
        - Tablet & Desktop (sm:grid-cols-12, >= 640px): 
          Row 1: User (col 1-5/4), Friends (col 6-12/8)
          Row 2: Stats (full width)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
        
        {/* 1. USER TILE (Top on mobile, Left on tablet/desktop) */}
        <div className="order-1 sm:order-1 sm:col-span-5 lg:col-span-4 flex">
          <UserTile 
            username="lilboooopp"
            MemberSince="Oct 2023"
            TotalGames={342}
            AvgScore={1234}
          />
        </div>

        {/* 2. STATS & HISTORY (Middle on mobile, Bottom full-width on tablet/desktop) */}
        <div className="order-2 sm:order-3 sm:col-span-12 flex flex-col gap-8 mt-4 w-full">        
          <div className="flex justify-center"> 
            <StatsView /> 
          </div>
          <GameHistoryList history={history} />
        </div>

        {/* 3. FRIENDS TILE (Bottom on mobile, Right on tablet/desktop) */}
        <div className="order-3 sm:order-2 sm:col-span-7 lg:col-span-8 flex">
          <FriendsTile />
        </div>

      </div>
      
    </div>
  );
};

export default WireframeDashboard;