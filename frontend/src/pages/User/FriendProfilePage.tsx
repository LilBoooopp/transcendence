import React, { useEffect, useState } from 'react';
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
    
    // Retrieve the friend data passed from the FriendsTile routing
    const profile = location.state?.friendData;
    const { friendData } = useLoaderData() as { friendData: any };
    console.log("Loader data received in FriendProfilePage:", friendData);

    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [history, setHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFriendData = async () => {
            if (!username) return;
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                };

                const [friendRes,] = await Promise.all([
                    fetch(`/api/users/username/${username}/`, { headers })
                ]);

                if (friendRes.ok) {
                    setChartData(await friendRes.json());
                } else {
                    setChartData({ bullet: [], blitz: [], rapid: [] });
                }
            } catch (error) {
                console.error("Failed to fetch friend data", error);
                setChartData({ bullet: [], blitz: [], rapid: [] });
                setHistory([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriendData();
    }, [username]);

    if (!profile) {
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
                 <h1 className="text-3xl font-heading font-bold text-text-default">{profile.username}'s Profile</h1>
            </div>

            <FriendProfileTile 
                username={profile.username}
                bio={profile.bio}
                avatarUrl={profile.avatarUrl}
                elo={profile.elo}
                currentStreak={profile.currentStreak}
                bestStreak={profile.bestStreak}
            />

            {/* Friend Stats & History View */}
            {!isLoading && chartData && (
                <div className="flex flex-col gap-8 mt-4 w-full">
                    <div className="flex justify-center">
                        <StatsView chartData={chartData} />
                    </div>
                    <GameHistoryList history={history} />
                </div>
            )}

            {/* Back Button positioned below the tile */}
            <div className="flex justify-center md:justify-start mt-2">
                 <Button variant="tertiary" onClick={() => navigate(-1)} className="text-sm px-6 py-2">
                     &larr; Back
                 </Button>
            </div>
        </div>
    );
}




/* friendDATA 


{
    "username": "test",
    "id": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
    "firstName": "test",
    "bio": "I will be happy to playhhhggfhfghfghfghfghfghfghfghfghfghfghfghfghfghI will be happy to playhhhggfhfghfghfghfghfghfghfghfghfghfghfghfghfgh",
    "isOnline": true,
    "avatarUrl": "",
    "statistics": {
        "id": "136aaf4f-121e-4f8e-9790-ed3f2ea0111f",
        "userId": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
        "bulletElo": 1184,
        "blitzElo": 1231,
        "rapidElo": 1216,
        "totalGames": 4,
        "wins": 3,
        "losses": 1,
        "draws": 0,
        "currentStreak": 3,
        "bestStreak": 3,
        "totalPlayTime": 7,
        "updatedAt": "2026-03-19T11:13:30.302Z"
    },
    "eloHistory": [
        {
            "id": "7dca05ab-6497-4acb-855b-6ab9971977e6",
            "userId": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
            "gameId": "c8c9a919-d41a-4d15-bbf0-f0132d3fb265",
            "gameType": "BULLET",
            "eloBefore": 1200,
            "eloAfter": 1184,
            "eloChange": -16,
            "opponentElo": 1200,
            "result": "loss",
            "createdAt": "2026-03-19T11:13:12.395Z"
        },
        {
            "id": "ee92319e-a2ad-42c2-be26-9041929c452c",
            "userId": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
            "gameId": "c3d0d337-afac-4b80-8464-a60c06782afa",
            "gameType": "BLITZ",
            "eloBefore": 1200,
            "eloAfter": 1216,
            "eloChange": 16,
            "opponentElo": 1200,
            "result": "win",
            "createdAt": "2026-03-19T11:13:18.653Z"
        },
        {
            "id": "851af1ca-a69c-4ac9-9963-e53ea4d7e209",
            "userId": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
            "gameId": "39abd59e-296b-4907-b029-f4bf988250a7",
            "gameType": "RAPID",
            "eloBefore": 1200,
            "eloAfter": 1216,
            "eloChange": 16,
            "opponentElo": 1200,
            "result": "win",
            "createdAt": "2026-03-19T11:13:22.454Z"
        },
        {
            "id": "b50eeb58-d3e9-4bb1-83fd-22ff5a5254ed",
            "userId": "02aba17a-bae1-49e9-acc7-5b10934a37f2",
            "gameId": "d828eb51-0b99-4a06-8853-ac5a327e0db3",
            "gameType": "BLITZ",
            "eloBefore": 1216,
            "eloAfter": 1231,
            "eloChange": 15,
            "opponentElo": 1184,
            "result": "win",
            "createdAt": "2026-03-19T11:13:30.302Z"
        }
    ]
}

*/