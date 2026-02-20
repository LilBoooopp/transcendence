import React from 'react';
import { styles } from '../styles';
import Button from './Button';

interface TileProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  options?: string[];
  selectedOption?: string;
  onSelect?: (option: string) => void;
}

export default function Tile({ title, description, icon, onClick, options, selectedOption, onSelect }: TileProps) {
  return (
	<div
	  className={`${styles.card} ${styles.transition} p-6 gap-3 h-full aspect-square overflow-hidden cursor-default flex flex-col items-center`}
	>
	  <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
		{icon && <div className="text-4xl text-text-default mb-4">{icon}</div>}
		{title && <h3 className="text-xl font-heading font-bold text-text-default mb-2 m-0">{title}</h3>}

		{options && options.length > 0 && (
			<div
			className="flex flex-wrap justify-center gap-1 bg-gray-100 p-1 rounded-lg z-10 mb-4 max-w-full"
			onClick={(e) => e.stopPropagation()}
			>
			{options.map((option) => (
				<button
				key={option}
				onClick={() => onSelect && onSelect(option)}
				className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
					selectedOption === option
					? 'bg-accent text-text-dark shadow-sm'
					: 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
				}`}
				>
				{option}
				</button>
			))}
			</div>
		)}

		{description && (
			<p className="text-text-default font-body text-sm m-0">
			{description}
			</p>
		)}
	  </div>

	  <Button variant="accent" onClick={onClick}>Start</Button>
	</div>
  );
}
