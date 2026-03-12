import React from 'react';

interface StatusBadgeProps {
  status: string;
  gameOver: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, gameOver }) => {
  const colors = gameOver
    ? 'bg-red-100 text-red-700 boarder-red-200'
    : status === 'Check!'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : status === 'Playing'
    ? 'bg-accent/40 text-secondary border-accent'
    : 'bg-primary/10 text-primary border-primary/20';

  return (
    <span className={`text-xs font-body font-semibold px-2.5 py-0.5 rounded-full border ${colors}`}>
      {status}
    </span>
  );
};