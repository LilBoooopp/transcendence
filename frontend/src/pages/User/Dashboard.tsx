import React, { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import UserTile from '../../components/UserTile';
import FriendsTile from '../../components/FriendsTile';
import LeaderboardTile, { LeaderboardPlayer } from '../../components/LeaderboardTile';

interface DashboardData {
  stats: {
    username: string;
    memberSince: string;
    totalGames: number;
    avgScore: number;
    blitzRating: number;
    rapidRating: number;
    bulletRating: number;
    currentStreak: number;
    bestStreak: number;
  };
  chartData: {
    bullet: { date: string; rating: number }[];
    blitz: { date: string; rating: number }[];
    rapid: { date: string; rating: number }[];
  };
  history: GameHistoryItem[];
  leaderboard: LeaderboardPlayer[];
}

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

// --- MAIN DASHBOARD COMPONENT ---
const WireframeDashboard = () => {
    const { stats, chartData, history, leaderboard } = useLoaderData() as DashboardData;
    const [view, setView] = useState<'menu' | 'time-selection'>('menu');

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
						currentStreak={stats.currentStreak}
						bestStreak={stats.bestStreak}
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
                {/* LEADERBOARD TILE */}
                <div className="order-4 sm:order-4 sm:col-span-12 flex">
                    <LeaderboardTile players={leaderboard} />
                </div>
            </div>
        </div>
    );
};

export default WireframeDashboard;
