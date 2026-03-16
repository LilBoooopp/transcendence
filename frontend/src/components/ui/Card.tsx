import React, { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
	variant?: 'primary' | 'surface';
}

export const Card: React.FC<CardProps> = ({ 
	children, 
	className = '', 
	onClick, 
	variant = 'primary' 
}) => {
	const baseClasses = "rounded-xl shadow-md transition-all duration-200";
	const interactiveClasses = onClick ? "cursor-pointer hover:shadow-lg" : "";
	
	const variants = {
		primary: "bg-primary hover:bg-primary-hover text-text-default",
		surface: "bg-primary text-text-dark" 
	};

	return (
		<div 
			onClick={onClick}
			className={`${baseClasses} ${variants[variant]} ${interactiveClasses} ${className}`}
		>
			{children}
		</div>
	);
};