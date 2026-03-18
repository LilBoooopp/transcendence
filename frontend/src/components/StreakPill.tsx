import React from 'react';
import { Flame } from 'lucide-react';

interface StreakPillProps {
  currentStreak?: number;
  bestStreak?: number;
  className?: string;
}

export default function StreakPill({ 
  currentStreak = 0, 
  bestStreak = 0, 
  className = '' 
}: StreakPillProps) {

  // Return both the UI elements and the tooltip text for the current state
  const getStreakData = () => {
    if (bestStreak === 0 && currentStreak === 0) {
      // Rule 1: Grey flame, no text
      return {
        content: <Flame size={16} className="text-gray-400 shrink-0" />,
        tooltip: "No active streak"
      };
    } 
    
    if (currentStreak < bestStreak) {
      // Rule 2: Blue flame, best / current
      return {
        content: (
          <>
            <Flame size={16} className="text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-text-default whitespace-nowrap">
              {bestStreak} <span className="text-gray-500 mx-0.5">/</span> {currentStreak}
            </span>
          </>
        ),
        tooltip: `Best Streak: ${bestStreak} | Current Streak: ${currentStreak}`
      };
    } 
    
    // Rule 3: Red flame, equal streak (and > 0)
    return {
      content: (
        <>
          <Flame size={16} className="text-red-500 shrink-0" />
          <span className="text-xs font-bold text-text-default whitespace-nowrap">
            {currentStreak}
          </span>
        </>
      ),
      tooltip: `On Fire! Current Streak: ${currentStreak} (Personal Best)`
    };
  };

  const { content, tooltip } = getStreakData();

  return (
    <div 
      title={tooltip}
      // Removed hover:bg-primary/80 and transition-colors below
      className={`bg-primary border border-gray-600 rounded-full px-3 py-1 flex items-center justify-center gap-1.5 shadow-md min-w-[3rem] whitespace-nowrap cursor-default ${className}`}
    >
      {content}
    </div>
  );
}