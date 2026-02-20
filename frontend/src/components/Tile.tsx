import React from 'react';
import { styles } from '../styles';

interface TileProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function Tile({ title, description, icon, onClick }: TileProps) {
  return (
    <div
      onClick={onClick}
      className={`${styles.card} ${styles.transition} ${styles.center} p-6 gap-3 h-full aspect-square overflow-hidden`}
    >
      {icon && <div className="text-4xl text-text-default">{icon}</div>}
      {title && <h3 className="text-xl font-heading font-bold text-text-default">{title}</h3>}
      {description && (
        <p className="text-text-default font-body text-sm">
          {description}
        </p>
      )}
    </div>
  );
}
