import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FriendProfileTile from '../../components/FriendProfileTile';
import Button from '../../components/Button';

export default function FriendProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Retrieve the friend data passed from the FriendsTile routing
    const profile = location.state?.friendData;

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
                 <h1 className="text-3xl font-heading font-bold text-text-default">Friend Stats</h1>
            </div>

            <FriendProfileTile 
                username={profile.username}
                bio={profile.bio}
                avatarUrl={profile.avatarUrl}
                elo={profile.elo}
                currentStreak={profile.currentStreak}
                bestStreak={profile.bestStreak}
            />

            {/* Back Button positioned below the tile */}
            <div className="flex justify-center md:justify-start mt-2">
                 <Button variant="tertiary" onClick={() => navigate(-1)} className="text-sm px-6 py-2">
                     &larr; Back
                 </Button>
            </div>
        </div>
    );
}