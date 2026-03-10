import React, { useState } from 'react';
import { Zap, Timer } from 'lucide-react';
import { LineChart } from '../components/charts/LineChart'; 
import { GameModeStatsCard } from '../components/GameModeStatsCard';
import themeColors from '../themeColors';

// --- 1. DUMMY DATA ---
const myRatingData = [
  { date: 'Week 1', rapid: 1100, blitz: 1050 },
  { date: 'Week 2', rapid: 1150, blitz: 1080 },
  { date: 'Week 3', rapid: 1130, blitz: 1120 },
  { date: 'Week 4', rapid: 1210, blitz: 1190 },
];

const blitzHistory = [
  { date: '1st', rating: 1100 },
  { date: '8th', rating: 1120 },
  { date: '15th', rating: 1090 },
  { date: '22nd', rating: 1150 },
  { date: 'Now', rating: 1214 },
];

const rapidHistory = [
  { date: '1st', rating: 1300 },
  { date: '8th', rating: 1305 },
  { date: '15th', rating: 1290 },
  { date: '22nd', rating: 1285 },
  { date: 'Now', rating: 1260 },
];


const StatsView = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Blitz Card */}
      <GameModeStatsCard 
        title="Blitz 3 min"
        icon={<Zap size={32} />}
        currentRating={1214}
        ratingDelta={+114}
        chartData={blitzHistory}
        chartColor={themeColors.accent.DEFAULT}
      />

      {/* Rapid Card */}
      <GameModeStatsCard 
        title="Rapid 10 min"
        icon={<Timer size={32} />}
        currentRating={1260}
        ratingDelta={-40}
        chartData={rapidHistory}
        chartColor={themeColors.primary.hover} 
      />
    </div>
  );
};

// --- 3. MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
  const [view, setView] = useState<'menu' | 'time-selection'>('menu');

  return (
    <div className="flex flex-col gap-8">
      
      {/* TOP SECTION: Play Menu & Open Games */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: The dynamic play menu */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 min-h-[400px]">
            {view === 'menu' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Play Chess</h2>
                <button onClick={() => setView('time-selection')} className="bg-blue-500 text-white p-2 rounded mt-4">
                  Test: Go to Time Selection
                </button>
              </div>
            )}

            {view === 'time-selection' && (
              <div>
                <button onClick={() => setView('menu')} className="text-gray-500 hover:text-black mb-4">
                  ← Back
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Time Control</h2>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Open Games */}
        <div className="lg:col-span-1 border-2 border-dashed border-blue-300 p-4 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Open Games</h3>
          <p className="text-gray-500">List of players looking for a match...</p>
        </div>
      </div>

      {/* BOTTOM SECTION: Statistics Dashboard */}
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Statistics</h2>
        
        {/* We just drop our local component right here! */}
        <StatsView />
        
        {/* We can also keep the old combined LineChart right below it if you want to see both! */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border-2 border-gray-800 mt-8">
          <LineChart 
            title="Combined Rating Progression (Past Month)"
            data={myRatingData}
            xAxisKey="date"
            height={350}
            series={[
              { dataKey: 'rapid', name: 'Rapid Elo', color: themeColors.primary.DEFAULT },
              { dataKey: 'blitz', name: 'Blitz Elo', color: themeColors.accent.DEFAULT }
            ]}
          />
        </div>

      </div>
    </div>
  );
};

// We only EXPORT the main Dashboard component, so App.tsx can use it.
export default WireframeDashboard;