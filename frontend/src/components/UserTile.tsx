// frontend/src/components/UserTile.tsx
import React from 'react';
import { Card } from './ui/Card';
import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming you use react-router for navigation

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
  if (MemberSince) displayInfoParts.push(`Member since ${MemberSince}`);
  if (TotalGames !== undefined && TotalGames !== null) displayInfoParts.push(`${TotalGames} Games Played`);
  if (AvgScore !== undefined && AvgScore !== null) displayInfoParts.push(`Avg. Score: ${AvgScore}`);

  return (
    <Card
      onClick={onClick}
      // Added 'relative' here to allow absolute positioning of the pencil icon inside the card
      className={`relative flex flex-col items-center justify-center text-center p-8 gap-4 w-full h-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Edit Profile Button (Pencil Icon) */}
      {/* We use e.stopPropagation() so clicking the pencil doesn't also trigger the Card's onClick if it has one */}
      <Link 
        to="/user" 
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-accent hover:bg-primary/30 transition-all z-10"
        title="Edit Profile"
      >
        <Pencil size={20} />
      </Link>

      {/* Avatar - Made slightly larger for vertical layout */}
      <div className="flex-shrink-0">
        <img
          src={avatarUrl || placeholderImage}
          alt={`${username}'s avatar`}
          className="w-28 h-28 rounded-full object-cover shadow-sm border-4 border-accent"
        />
      </div>

      {/* Text Information */}
      <div className="flex flex-col items-center w-full overflow-hidden gap-1">
        <h3 className="text-3xl font-heading font-bold text-text-default m-0 truncate w-full">
          {username}
        </h3>
        
        {displayInfoParts.length > 0 && (
          <div className="text-body text-gray-400 mt-2 flex flex-col gap-1 text-sm">
            {displayInfoParts.map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}