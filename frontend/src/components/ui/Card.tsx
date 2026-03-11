import React, { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
	return (
		<div 
			onClick={onClick}
			className={`bg-primary hover:bg-primary-hover rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${className} ${onClick ? 'cursor-pointer' : ''}`}
		>
			{children}
		</div>
	);
};