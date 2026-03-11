import React from 'react';
import { styles } from '../styles'; // Adjust the path if necessary

interface UserTileProps {
  username: string;
  avatarUrl?: string; // Optional: in case the user doesn't have a picture
  MemberSince?: string;
  TotalGames?: number;
  AvgScore?: number;

  onClick?: () => void;
}

export default function UserTile({ username, avatarUrl, MemberSince, TotalGames, AvgScore, onClick }: UserTileProps) {
  // A generic placeholder image if no avatarUrl is provided
  const placeholderImage = "https://ui-avatars.com/api/?name=" + username + "&background=random";

  // Construct the info string dynamically from the individual props with labels
  const displayInfoParts: string[] = [];
  if (MemberSince) {
    displayInfoParts.push(`Member since ${MemberSince}`);
  }
  if (TotalGames !== undefined && TotalGames !== null) { // Check for undefined/null explicitly
    displayInfoParts.push(`${TotalGames} Games Played`);
  }
  if (AvgScore !== undefined && AvgScore !== null) { // Check for undefined/null explicitly
    displayInfoParts.push(`Avg. Score: ${AvgScore}`);
  }
  const displayInfo = displayInfoParts.join(' • ');

  return (
    <div
      onClick={onClick}
      className={`${styles.card} ${styles.transition} flex flex-row items-center p-5 gap-5 w-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
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
        
        {/* Big Username on Top */}
        <h3 className="text-2xl font-heading font-bold text-text-default m-0 truncate">
          {username}
        </h3>
        
        {/* Information Below Username */}
        {displayInfo && ( // Only render if there's information to display
          <p className="text-body text-text-default mt-1 m-0 truncate">
            {displayInfo}
          </p>
        )}
      </div>
    </div>
  );
}