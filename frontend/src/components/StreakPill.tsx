import React from 'react';
import { Flame } from 'lucide-react';

interface StreakPillProps {
  currentStreak?: number;
  bestStreak?: number;
  className?: string; // Allows us to pass positioning classes (like absolute, -bottom-3)
}

export default function StreakPill({ 
  currentStreak = 0, 
  bestStreak = 0, 
  className = '' 
}: StreakPillProps) {

  const renderContent = () => {
    if (bestStreak === 0 && currentStreak === 0) {
      // Rule 1: Grey flame, no text
      return <Flame size={16} className="text-gray-400 shrink-0" />;
    } 
    
    if (currentStreak < bestStreak) {
      // Rule 2: Blue flame, best / current
      return (
        <>
          <Flame size={16} className="text-blue-500 shrink-0" />
          <span className="text-xs font-bold text-text-default whitespace-nowrap">
            {bestStreak} <span className="text-gray-500 mx-0.5">/</span> {currentStreak}
          </span>
        </>
      );
    } 
    
    // Rule 3: Red flame, equal streak (and > 0)
    return (
      <>
        <Flame size={16} className="text-red-500 shrink-0" />
        <span className="text-xs font-bold text-text-default whitespace-nowrap">
          {currentStreak}
        </span>
      </>
    );
  };

  return (
    <div className={`bg-primary border border-gray-600 rounded-full px-3 py-1 flex items-center justify-center gap-1.5 shadow-md min-w-[3rem] whitespace-nowrap ${className}`}>
      {renderContent()}
    </div>
  );
}