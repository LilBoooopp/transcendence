import React from 'react';

interface StatusBadgeProps {
  status: string;
  gameOver: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, gameOver }) => {
  const colors = gameOver
    ? 'bg-tertiary text-text-default'
    : status === 'Checkmate!'
    ? 'bg-secondary text-text-default'
    : status === 'Check!'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : status === 'Playing'
    ? 'bg-primary text-text-default'
    : 'bg-primary text-text-default';

  return (
    <span className={`text-sm font-body font-semibold px-3 py-0.5 rounded-full ${colors}`}>
      {status}
    </span>
  );
};