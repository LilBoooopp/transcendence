import React, { useState } from 'react';
import { Zap, Timer } from 'lucide-react';
import { LineChart } from '../components/charts/LineChart'; 
import { GameModeStatsCard } from '../components/GameModeStatsCard';
import themeColors from '../themeColors';
import GameHistoryList, { GameHistoryItem } from '../components/GameHistoryList';
import UserTile from '../components/UserTile'; // <-- 1. Imported the UserTile here

// --- 1. DUMMY DATA ---
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

const history: GameHistoryItem[] = [
    { id: '1', date: '2023-10-24', opponent: 'GrandMasterFlash', result: 'Win', moves: 34, mode: 'Blitz', accuracy: 89 },
    { id: '2', date: '2023-10-22', opponent: 'Rookie123', result: 'Loss', moves: 21, mode: 'Bullet', accuracy: 65 },
    { id: '3', date: '2023-10-20', opponent: 'ChessBot', result: 'Draw', moves: 55, mode: 'Rapid', accuracy: 92 },
];


const StatsView = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Blitz Card */}
      <GameModeStatsCard 
        title="Blitz"
        icon={<Zap size={32} />}
        currentRating={1214}
        ratingDelta={+114}
        chartData={blitzHistory}
        chartColor={themeColors.accent.DEFAULT}
      />

      {/* Rapid Card */}
      <GameModeStatsCard 
        title="Rapid"
        icon={<Timer size={32} />}
        currentRating={1260}
        ratingDelta={-40}
        chartData={rapidHistory}
        chartColor={themeColors.accent.DEFAULT} 
      />
    </div>
  );
};

// --- 3. MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
  const [view, setView] = useState<'menu' | 'time-selection'>('menu');

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto py-8 px-4">
      
      {/* TOP SECTION: User Profile Tile */}
      <div className="w-full flex justify-center">
        <UserTile 
          username="lilboooopp"
          MemberSince="Oct 2023"
          TotalGames={342}
          AvgScore={1234}
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