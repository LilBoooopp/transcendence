import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, useLoaderData } from 'react-router-dom';
import FriendProfileTile from '../../components/FriendProfileTile';
import Button from '../../components/Button';
import * as Icons from 'lucide-react';
import { GameModeStatsCard } from '../../components/GameModeStatsCard';
import GameHistoryList, { GameHistoryItem } from '../../components/GameHistoryList';
import { useNotification } from '../../notifications';

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

function ReportModal({ userId, username, onClose }: { userId: string; username: string; onClose: () => void }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const { push } = useNotification();

    async function submit() {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ reason: reason.trim() }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message ?? 'Failed');
            }
            push({ type: 'success', title: 'Report submitted', message: 'Admins will review your report.', duration: 4000 });
            onClose();
        } catch (e: any) {
            push({ type: 'error', title: 'Report failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-heading font-bold text-text-default flex items-center gap-2">
                        <Icons.Flag size={20} className="text-accent" /> Report {username}
                    </h2>
                    <button onClick={onClose} className="text-text-default/40 hover:text-text-default transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>
                <p className="text-sm text-text-default/60">Describe why you're reporting this player. Admins will review your report.</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Using a chess engine, abusive behavior…"
                    rows={4}
                    className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60 resize-none"
                />
                <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose} className="px-4 py-2 text-sm">Cancel</Button>
                    <Button variant="tertiary" onClick={submit} disabled={!reason.trim() || loading} className="px-4 py-2 text-sm">
                        {loading ? 'Sending…' : 'Submit report'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function FriendProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [reportOpen, setReportOpen] = useState(false);
    
    const profile = location.state?.friendData;
    const { friendData } = useLoaderData() as { friendData: any };
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
                elo={
                    friendData?.statistics
                        ? Math.round(
                            ((friendData.statistics.bulletElo ?? 1200) +
                             (friendData.statistics.blitzElo ?? 1200) +
                             (friendData.statistics.rapidElo ?? 1200)) / 3
                          )
                        : profile?.elo || 1200
                }
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

            {/* Back + Report */}
            <div className="flex justify-between items-center mt-2">
                <Button variant="tertiary" onClick={() => navigate(-1)} className="text-sm px-6 py-2">
                    &larr; Back
                </Button>
                <Button variant="secondary" onClick={() => setReportOpen(true)} className="text-sm px-4 py-2 flex items-center gap-2">
                    <Icons.Flag size={15} /> Report
                </Button>
            </div>

            {reportOpen && (
                <ReportModal
                    userId={friendData?.id}
                    username={friendData?.username || profile?.username}
                    onClose={() => setReportOpen(false)}
                />
            )}
        </div>
    );
}