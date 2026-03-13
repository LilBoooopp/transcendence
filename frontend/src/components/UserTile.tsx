// frontend/src/components/UserTile.tsx
import React from 'react';
import { Card } from './ui/Card';

interface UserTileProps {
	username: string;
	avatarUrl?: string;
	MemberSince?: string;
	TotalGames?: number;
	AvgScore?: number;
	onClick?: () => void;
}

export default function UserTile({ username, avatarUrl, MemberSince, TotalGames, AvgScore, onClick }: UserTileProps) {
	const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";

	const displayInfoParts: string[] = [];
	if (MemberSince) {
		displayInfoParts.push(`Member since ${MemberSince}`);
	}
	if (TotalGames !== undefined && TotalGames !== null) {
		displayInfoParts.push(`${TotalGames} Games Played`);
	}
	if (AvgScore !== undefined && AvgScore !== null) {
		displayInfoParts.push(`Avg. Score: ${AvgScore}`);
	}
	const displayInfo = displayInfoParts.join(' • ');

	return (
		<Card
			onClick={onClick}
			className={`flex flex-row items-center p-5 gap-5 w-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
		>
			{/* LEFT SIDE: Profile Picture */}
			<div className="flex-shrink-0">
				<img
					src={avatarUrl || placeholderImage}
					alt={`${username}'s avatar`}
					className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-accent"
				/>
			</div>

			{/* RIGHT SIDE: Text Information */}
			<div className="flex flex-col justify-center flex-grow overflow-hidden">
				<h3 className="text-2xl font-heading font-bold text-text-default m-0 truncate">
					{username}
				</h3>
				{displayInfo && (
					<p className="text-body text-text-default mt-1 m-0 truncate">
						{displayInfo}
					</p>
				)}
			</div>
		</Card>
	);
}