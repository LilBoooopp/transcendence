import React from 'react';
import { useParams, useNavigate, useLocation, useLoaderData } from 'react-router-dom';
import FriendProfileTile from '../../components/FriendProfileTile';
import Button from '../../components/Button';
import * as Icons from 'lucide-react';
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';

interface ChartDataPoint {
    date: string;
    rating: number;
}

interface ChartData {
    bullet: ChartDataPoint[];
    blitz: ChartDataPoint[];
    rapid: ChartDataPoint[];
}

const StatsView = ({ chartData }: { chartData: ChartData }) => {
    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Bullet Card */}
            <GameModeStatsCard
                title="Bullet"
                icon={<Icons.Zap size={36} />}
                currentRating={chartData.bullet?.[chartData.bullet.length - 1]?.rating || 1200}
                ratingDelta={chartData.bullet?.length > 1 ? chartData.bullet[chartData.bullet.length - 1].rating - chartData.bullet[0].rating : 0}
                chartData={chartData.bullet || []}
                chartColor="#AEC3B0"
            />

            {/* Blitz Card */}
            <GameModeStatsCard
                title="Blitz"
                icon={<Icons.Flame size={36} />}
                currentRating={chartData.blitz?.[chartData.blitz.length - 1]?.rating || 1200}
                ratingDelta={chartData.blitz?.length > 1 ? chartData.blitz[chartData.blitz.length - 1].rating - chartData.blitz[0].rating : 0}
                chartData={chartData.blitz || []}
                chartColor="#AEC3B0"
            />

            {/* Rapid Card */}
            <GameModeStatsCard
                title="Rapid"
                icon={<Icons.Timer size={36} />}
                currentRating={chartData.rapid?.[chartData.rapid.length - 1]?.rating || 1200}
                ratingDelta={chartData.rapid?.length > 1 ? chartData.rapid[chartData.rapid.length - 1].rating - chartData.rapid[0].rating : 0}
                chartData={chartData.rapid || []}
                chartColor="#AEC3B0"
            />
        </div>
    );
};

export default function FriendProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const profile = location.state?.friendData;
    const { friendData } = useLoaderData() as { friendData: any };
		console.log(friendData);
    const chartData: ChartData = friendData?.userElo || { bullet: [], blitz: [], rapid: [] };
    const historyData: GameHistoryItem[] = friendData?.userStats || [];
    if (!profile && !friendData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-4 text-center">
                <div className="text-red-400 text-4xl font-bold">Oops!</div>
                <div className="text-text-default max-w-md">
                    No data found for {username}. Please access this page through your friends list.
                </div>
                <Button variant="secondary" onClick={() => navigate(-1)} className="px-6 py-2">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex justify-center md:justify-start">
                 <h1 className="text-3xl font-heading font-bold text-text-default">
                    {friendData?.username || profile?.username}'s Profile
                 </h1>
            </div>

            <FriendProfileTile 
                username={friendData?.username || profile?.username}
                bio={friendData?.bio || profile?.bio} 
                avatarUrl={friendData?.avatarUrl || profile?.avatarUrl}
                elo={profile?.elo || 1200}
                currentStreak={friendData?.statistics?.currentStreak || profile?.currentStreak || 0}
                bestStreak={friendData?.statistics?.bestStreak || profile?.bestStreak || 0}
            />

            {/* Friend Stats & History View */}
            <div className="flex flex-col gap-8 mt-4 w-full">
                <div className="flex justify-center">
                    <StatsView chartData={chartData} />
                </div>
                <GameHistoryList history={historyData} />
            </div>

            {/* Back Button positioned below the tile */}
            <div className="flex justify-center md:justify-start mt-2">
                 <Button variant="tertiary" onClick={() => navigate(-1)} className="text-sm px-6 py-2">
                     &larr; Back
                 </Button>
            </div>
        </div>
    );
}