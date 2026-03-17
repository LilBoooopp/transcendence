import React from 'react';
import { Card } from './ui/Card';

interface TileProps {
	title?: string;
	description?: string;
	icon?: React.ReactNode;
	onClick?: () => void;
}

export default function Tile({ title, description, icon, onClick }: TileProps) {
	return (
		<Card
			onClick={onClick}
className="flex flex-col items-center justify-center text-center p-5 sm:p-6 gap-3 h-full min-h-[12rem] sm:aspect-square overflow-hidden"		>
			{icon && <div className="text-4xl text-text-default">{icon}</div>}
			{title && <h3 className="text-xl font-heading font-bold text-text-default">{title}</h3>}
			{description && (
				<p className="text-text-default font-body text-sm">
					{description}
				</p>
			)}
		</Card>
	);
}